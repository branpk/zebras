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

const renderOpListItem = (index, op, toggleOpIndex) => {
  return createElement("li", { class: "op-list-item", "data-index": index }, [
    createElement("div", { class: "label" }, `${index}: ${op.type}`, {
      click: () => toggleOpIndex(index),
    }),
    createElement("textarea", { class: "data" }, JSON.stringify(op, null, 2)),
  ]);
};

const renderOpList = (imageInfo, toggleOpIndex) => {
  return createElement(
    "ol",
    { class: "op-list" },
    imageInfo.ops.map((op, i) => renderOpListItem(i + 1, op, toggleOpIndex)),
  );
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

  const selectImage = (imageKey) => {
    if (state.selectedImageKey === imageKey) {
      return;
    }

    selectOpIndex(null);

    document
      .querySelectorAll(".image-list-item.selected")
      .forEach((elt) => elt.classList.remove("selected"));
    if (imageKey !== null) {
      document
        .querySelector(`.image-list-item[data-key="${imageKey}"]`)
        .classList.add("selected");
    }

    const opListPane = document.querySelector(".op-list-pane");
    if (imageKey === null) {
      opListPane.replaceChildren();
    } else {
      opListPane.replaceChildren(
        renderOpList(getImageInfo(imageKey), toggleOpIndex),
      );
    }

    state.selectedImageKey = imageKey;
    const imageViewPane = document.querySelector(".image-view-pane");
    if (imageKey === null) {
      imageViewPane.replaceChildren();
    } else {
      imageViewPane.replaceChildren(renderImageView(getImageInfo(imageKey)));
    }
  };

  const selectOpIndex = (index) => {
    document
      .querySelectorAll(".op-list-item.selected")
      .forEach((elt) => elt.classList.remove("selected"));

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

  const getImageInfo = (imageKey) => {
    return state.imagesInfo.find((info) => info.key === imageKey);
  };

  rpc("get_images_info").then(setImagesInfo);

  return app;
};

document.body.append(renderApp());
