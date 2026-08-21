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

  const onEdit = (e) => {
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
      <textarea class="data" onInput={onEdit}>
        {JSON.stringify(op, null, 2)}
      </textarea>
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
              box: [0, 0, imageInfo.dims[0], imageInfo.dims[1]],
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
              box: [0, 0, imageInfo.dims[0], imageInfo.dims[1]],
            })
          }
        >
          New negative
        </button>
      </div>
    </ol>
  );
}

function ImageView({ imageStatus, imageUrl }) {
  return (
    <div className="image-view">
      <div class="status">Status: {imageStatus}</div>
      <div class="img-wrapper">
        <img src={imageUrl} />
      </div>
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
          [selectedImageKey]: `/${response.path}`,
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
    setImageStatuses((statuses) => ({
      ...statuses,
      [imageInfo.key]: "processing",
    }));
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
            imageStatus={imageStatuses[selectedImageKey] ?? "unknown"}
            imageUrl={
              imageUrls[selectedImageKey] ??
              `/${selectedImageInfo.original_path}`
            }
          />
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.body);
root.render(createElement(App));
