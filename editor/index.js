const rpc = async (fn, args = {}) => {
  const response = await fetch("/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fn,
      ...args,
    }),
  });
  return await response.json();
};

const flatten = (items) =>
  items instanceof Array ? items.flatMap(flatten) : [items];

const createElement = (
  tag,
  attributes = {},
  children = [],
  eventHandlers = {},
) => {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  element.append(...flatten(children));
  for (const [key, value] of Object.entries(eventHandlers)) {
    element.addEventListener(key, value);
  }
  return element;
};

const renderImageListItem = (imageInfo, selectImage) => {
  return createElement(
    "li",
    { class: "image-list-item", "data-key": imageInfo.key },
    [imageInfo.key],
    {
      click: () => selectImage(imageInfo.key),
    },
  );
};

const renderImageList = (imagesInfo, selectImage) => {
  return createElement(
    "ul",
    { class: "image-list" },
    imagesInfo.map((imageInfo) => renderImageListItem(imageInfo, selectImage)),
  );
};

const renderOpListItem = (index, op, toggleOpIndex, editOp) => {
  return createElement("li", { class: "op-list-item", "data-index": index }, [
    createElement("div", { class: "label" }, `${index}: ${op.type}`, {
      click: () => toggleOpIndex(index),
    }),
    createElement("textarea", { class: "data" }, JSON.stringify(op, null, 2), {
      input: (e) => editOp(index, e.target.value),
    }),
  ]);
};

const renderOpList = (imageInfo, toggleOpIndex, newOp, editOp) => {
  return createElement("ol", { class: "op-list" }, [
    imageInfo.ops.map((op, i) =>
      renderOpListItem(i + 1, op, toggleOpIndex, editOp),
    ),
    createElement("div", { class: "op-list-new-buttons" }, [
      createElement("button", {}, "New positive", {
        click: () =>
          newOp({
            type: "positive",
            enabled: true,
            box: [0, 0, imageInfo.dims[0], imageInfo.dims[1]],
            relative_sigma: 30,
            chroma_strength: 0.5,
          }),
      }),
      createElement("button", {}, "New negative", {
        click: () =>
          newOp({
            type: "negative",
            enabled: true,
            box: [0, 0, imageInfo.dims[0], imageInfo.dims[1]],
          }),
      }),
    ]),
  ]);
};

const renderImageView = (imageInfo) => {
  return createElement("img", {
    class: "image-view-img",
    src: `/${imageInfo.original_path}`,
  });
};

const renderApp = () => {
  const app = createElement("div", { class: "app" }, [
    createElement("div", { class: "image-list-pane" }),
    createElement("div", { class: "op-list-pane" }),
    createElement("div", { class: "image-view-pane" }),
  ]);

  const state = {
    imagesInfo: null,
    selectedImageKey: null,
    selectedOpIndex: null,
  };
  window.state = state;

  const setImagesInfo = (imagesInfo) => {
    selectOpIndex(null);
    selectImage(null);

    state.imagesInfo = imagesInfo;
    document
      .querySelector(".image-list-pane")
      .replaceChildren(renderImageList(imagesInfo, selectImage));
  };

  const getImageInfo = (imageKey) => {
    return state.imagesInfo.find((info) => info.key === imageKey);
  };

  const selectImage = (imageKey) => {
    if (state.selectedImageKey === imageKey) {
      return;
    }

    selectOpIndex(null);
    state.selectedImageKey = imageKey;

    document
      .querySelectorAll(".image-list-item.selected")
      .forEach((elt) => elt.classList.remove("selected"));
    if (imageKey !== null) {
      document
        .querySelector(`.image-list-item[data-key="${imageKey}"]`)
        .classList.add("selected");
    }

    displayOpList();

    const imageViewPane = document.querySelector(".image-view-pane");
    if (imageKey === null) {
      imageViewPane.replaceChildren();
    } else {
      imageViewPane.replaceChildren(renderImageView(getImageInfo(imageKey)));
    }
  };

  const displayOpList = () => {
    const opListPane = document.querySelector(".op-list-pane");
    if (state.selectedImageKey === null) {
      opListPane.replaceChildren();
    } else {
      opListPane.replaceChildren(
        renderOpList(
          getImageInfo(state.selectedImageKey),
          toggleOpIndex,
          newOp,
          editOp,
        ),
      );
    }
  };

  const selectOpIndex = (index) => {
    document
      .querySelectorAll(".op-list-item.selected")
      .forEach((elt) => elt.classList.remove("selected"));

    if (state.selectedOpIndex !== null) {
      const opItem = document.querySelector(
        `.op-list-item[data-index="${state.selectedOpIndex}"]`,
      );
      const imageInfo = getImageInfo(state.selectedImageKey);
      opItem.querySelector(".data").value = JSON.stringify(
        imageInfo.ops[state.selectedOpIndex - 1],
        null,
        2,
      );
      opItem.classList.remove("error");
    }

    state.selectedOpIndex = index;
    if (index !== null) {
      document
        .querySelector(`.op-list-item[data-index="${index}"]`)
        .classList.add("selected");
    }
  };

  const toggleOpIndex = (index) => {
    if (state.selectedOpIndex === index) {
      selectOpIndex(null);
    } else {
      selectOpIndex(index);
    }
  };

  const newOp = (op) => {
    if (state.selectedImageKey !== null) {
      selectOpIndex(null);

      const imageInfo = getImageInfo(state.selectedImageKey);
      imageInfo.ops.push(op);
      displayOpList();

      selectOpIndex(imageInfo.ops.length);
    }
  };

  const editOp = (index, text) => {
    const opItemElement = document.querySelector(
      `.op-list-item[data-index="${index}"]`,
    );

    let op;
    try {
      op = JSON.parse(text);
      opItemElement.classList.remove("error");
    } catch (e) {
      opItemElement.classList.add("error");
      return;
    }

    if (state.selectedImageKey !== null) {
      const imageInfo = getImageInfo(state.selectedImageKey);
      imageInfo.ops[index - 1] = op;
    }
  };

  rpc("get_images_info").then(setImagesInfo);

  return app;
};

document.body.append(renderApp());
