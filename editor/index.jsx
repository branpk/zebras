import React, { createElement, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

async function rpc(fn, args = {}) {
  const response = await fetch("/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fn,
      ...args,
    }),
  });
  return await response.json();
}

function ImageListItem({ imageInfo, isSelected, selectImage }) {
  return (
    <li
      className={`image-list-item ${isSelected ? "selected" : ""}`}
      onClick={() => selectImage(imageInfo.key)}
    >
      {imageInfo.key}
    </li>
  );
}

function ImageList({ imagesInfo, selectedImageKey, selectImage }) {
  return (
    <ul className="image-list">
      {imagesInfo.map((imageInfo) => (
        <ImageListItem
          key={imageInfo.key}
          imageInfo={imageInfo}
          isSelected={selectedImageKey === imageInfo.key}
          selectImage={selectImage}
        />
      ))}
    </ul>
  );
}

function OpListItem({ index, op, isSelected, toggleOpIndex, updateOp }) {
  const [isError, setIsError] = useState(false);
  const [editedText, setEditedText] = useState(null);

  useEffect(() => {
    setIsError(false);
    setEditedText(null);
  }, [op]);

  const onEdit = (e) => {
    setEditedText(e.target.value);
    let op = undefined;
    try {
      op = JSON.parse(e.target.value);
      setIsError(false);
    } catch (e) {
      setIsError(true);
    }
    if (op !== undefined) {
      updateOp(index, op);
    }
  };

  return (
    <li
      className={`op-list-item ${isSelected ? "selected" : ""} ${isError ? "error" : ""}`}
    >
      <div
        className="label"
        onClick={() => toggleOpIndex(index)}
      >{`${index}: ${op.type}`}</div>
      <textarea
        class="data"
        onChange={onEdit}
        value={editedText ?? JSON.stringify(op, null, 2)}
      ></textarea>
    </li>
  );
}

function OpList({
  imageInfo,
  selectedOpIndex,
  toggleOpIndex,
  newOp,
  updateOp,
}) {
  return (
    <ol className="op-list">
      <div>
        {imageInfo.ops.map((op, index) => (
          <OpListItem
            key={index}
            index={index}
            op={op}
            isSelected={index === selectedOpIndex}
            toggleOpIndex={toggleOpIndex}
            updateOp={updateOp}
          />
        ))}
      </div>
      <div className="op-list-new-buttons">
        <button
          onClick={() =>
            newOp({
              type: "positive",
              enabled: true,
              box: [0, 0, 0, 0],
              relative_sigma: 30,
              chroma_strength: 0.5,
            })
          }
        >
          New positive
        </button>
        <button
          onClick={() =>
            newOp({
              type: "negative",
              enabled: true,
              box: [0, 0, 0, 0],
            })
          }
        >
          New negative
        </button>
      </div>
    </ol>
  );
}

function ImageView({ imageStatus, lightImageUrl, darkImageUrl }) {
  const [mode, setMode] = useState("Dark");
  return (
    <div className="image-view">
      <div class="status">Status: {imageStatus}</div>
      <button
        class="mode-toggle"
        onClick={() => {
          if (mode === "Dark") {
            setMode("Light");
          } else {
            setMode("Dark");
          }
        }}
      >
        Mode: {mode}
      </button>
      <div class="img-wrapper">
        <img
          class="img"
          src={mode === "Light" ? lightImageUrl : darkImageUrl}
        />
      </div>
    </div>
  );
}

function ImageOverlay({ box, setBox }) {
  const [dragState, setDragState] = useState(null);

  const updateBox = () => {
    if (!dragState) {
      return;
    }
    const img = document.getElementsByClassName("img")[0];
    if (!img) {
      return;
    }

    const boxLeft = Math.min(dragState.start[0], dragState.current[0]);
    const boxRight = Math.max(dragState.start[0], dragState.current[0]);
    const boxTop = Math.min(dragState.start[1], dragState.current[1]);
    const boxBottom = Math.max(dragState.start[1], dragState.current[1]);

    const imgRect = img.getBoundingClientRect();

    const getX = (x) =>
      Math.min(
        Math.max(((x - imgRect.left) / imgRect.width) * img.naturalWidth, 0),
        img.naturalWidth,
      );
    const getY = (y) =>
      Math.min(
        Math.max(((y - imgRect.top) / imgRect.height) * img.naturalHeight, 0),
        img.naturalHeight,
      );

    const box = [getX(boxLeft), getY(boxTop), getX(boxRight), getY(boxBottom)];
    if (Math.min(box[2] - box[0], box[3] - box[1]) < 5) {
      return;
    }
    setBox(box);
  };

  useEffect(() => {
    const listener = () => {
      if (dragState) {
        updateBox();
        setDragState(null);
      }
    };
    document.addEventListener("mouseup", listener);
    return () => document.removeEventListener("mouseup", listener);
  });

  useEffect(() => {
    const listener = (e) => {
      if (dragState) {
        setDragState((state) => ({
          ...state,
          current: [e.clientX, e.clientY],
        }));
      }
    };
    document.addEventListener("mousemove", listener);
    return () => document.removeEventListener("mousemove", listener);
  });

  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Escape") {
        setDragState(null);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  });

  return (
    <div
      className="image-overlay"
      onMouseDown={(e) => {
        setDragState({
          start: [e.clientX, e.clientY],
          current: [e.clientX, e.clientY],
        });
        e.preventDefault();
      }}
    >
      {dragState && (
        <div
          className="drag-box"
          style={{
            top: `${Math.min(dragState.start[1], dragState.current[1])}px`,
            left: `${Math.min(dragState.start[0], dragState.current[0])}px`,
            width: `${Math.abs(dragState.start[0] - dragState.current[0])}px`,
            height: `${Math.abs(dragState.start[1] - dragState.current[1])}px`,
          }}
        />
      )}
    </div>
  );
}

function App() {
  const [imagesInfo, setImagesInfo] = useState(null);
  const [imageStatuses, setImageStatuses] = useState({});
  const [imageUrls, setImageUrls] = useState({});

  const [selectedImageKey, setSelectedImageKey] = useState(null);
  const [selectedOpIndex, setSelectedOpIndex] = useState(null);

  const getImageInfo = (imageKey) => {
    return imagesInfo?.find((info) => info.key === imageKey) ?? null;
  };

  const selectedImageInfo = selectedImageKey
    ? getImageInfo(selectedImageKey)
    : null;

  const selectImage = (imageKey) => {
    setSelectedOpIndex(null);
    setSelectedImageKey(imageKey);
    refreshStatus();
  };

  const refreshStatus = () => {
    if (selectedImageKey) {
      rpc("get_image_status", { key: selectedImageKey }).then((response) => {
        setImageStatuses((statuses) => ({
          ...statuses,
          [selectedImageKey]: response.status,
        }));
        setImageUrls((urls) => ({
          ...urls,
          [selectedImageKey]: `/${response.path}?t=${Date.now()}`,
        }));
      });
    }
  };

  const updateImageInfo = (imageInfo) => {
    setImagesInfo((imagesInfo) =>
      imagesInfo.map((existing) =>
        existing.key === selectedImageKey ? imageInfo : existing,
      ),
    );
    rpc("update_image_info", {
      image_info: imageInfo,
    });
  };

  const toggleOpIndex = (index) => {
    if (selectedOpIndex === index) {
      setSelectedOpIndex(null);
    } else {
      setSelectedOpIndex(index);
    }
  };

  const newOp = (op) => {
    if (selectedImageInfo) {
      const newIndex = selectedImageInfo.ops.length;
      updateImageInfo({
        ...selectedImageInfo,
        ops: [...selectedImageInfo.ops, op],
      });
      setSelectedOpIndex(newIndex);
    }
  };

  const updateOp = (index, op) => {
    if (selectedImageInfo) {
      updateImageInfo({
        ...selectedImageInfo,
        ops: selectedImageInfo.ops.with(index, op),
      });
    }
  };

  const setBox = (box) => {
    if (selectedImageInfo && selectedOpIndex !== null) {
      updateImageInfo({
        ...selectedImageInfo,
        ops: selectedImageInfo.ops.with(selectedOpIndex, {
          ...selectedImageInfo.ops[selectedOpIndex],
          box,
        }),
      });
    }
  };

  useEffect(() => {
    rpc("get_images_info").then(setImagesInfo);
  }, []);
  useEffect(() => {
    const interval = setInterval(refreshStatus, 300);
    return () => clearInterval(interval);
  }, [selectedImageKey]);

  return (
    <div className="app">
      <div className="image-list-pane">
        {imagesInfo && (
          <ImageList
            imagesInfo={imagesInfo}
            selectedImageKey={selectedImageKey}
            selectImage={selectImage}
          />
        )}
      </div>
      <div className="op-list-pane">
        {selectedImageInfo && (
          <OpList
            imageInfo={selectedImageInfo}
            selectedOpIndex={selectedOpIndex}
            toggleOpIndex={toggleOpIndex}
            newOp={newOp}
            updateOp={updateOp}
          />
        )}
      </div>
      <div className="image-view-pane">
        {selectedImageInfo && (
          <ImageView
            imageInfo={selectedImageInfo}
            imageStatus={imageStatuses[selectedImageKey] ?? "..."}
            lightImageUrl={`/${selectedImageInfo.original_path}`}
            darkImageUrl={
              imageUrls[selectedImageKey] ??
              `/${selectedImageInfo.original_path}`
            }
          />
        )}
        {selectedImageInfo && selectedOpIndex !== null && (
          <ImageOverlay
            box={selectedImageInfo.ops[selectedOpIndex].box}
            setBox={setBox}
          />
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.body);
root.render(createElement(App));
