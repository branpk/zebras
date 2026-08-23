import "./main.css";

function html(
  tag: string,
  attributes: { [name: string]: string } = {},
  children: (string | Node)[] = [],
  listeners: { [type: string]: (e: Event) => void } = {},
): HTMLElement {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  element.append(...children);
  for (const [type, listener] of Object.entries(listeners)) {
    element.addEventListener(type, listener);
  }
  return element;
}

const IMAGE_KEYS = [
  "HzrMFIp7",
  "eZfrguVj",
  "wlKqmQP1",
  "K6alOenI",
  "bS1WqnzE",
  "r5xAUZEK",
  "qUXGHIrO",
  "ijOSySK4",
  "Q8wbPlSy",
  "W6DXchRX",
  "5dm83Xga",
  "IJVW9F1G",
  "80NPHpZ6",
  "Lcdj0712",
  "FZjRUnLW",
  "o6yVUfPB",
  "qb4dfkoJ",
  "mfAGI3rU",
  "32zgzxZd",
  "dtJlqi7L",
  "ZPlkjtvi",
  // "DmXfJ9lt",
];

function App() {
  let isDarkMode = false;

  const toggleDarkMode = () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      app.classList.add("dark-mode");
      app.classList.remove("light-mode");
    } else {
      app.classList.add("light-mode");
      app.classList.remove("dark-mode");
    }
    darkModeToggle.textContent = isDarkMode
      ? "Disable dark mode"
      : "Enable dark mode";
  };

  const darkModeToggle = html(
    "button",
    { class: "dark-mode-toggle" },
    ["Enable dark mode"],
    {
      click: toggleDarkMode,
    },
  );

  const images = IMAGE_KEYS.map((key) =>
    html("div", { class: "image-wrapper" }, [
      html("img", { class: "image-light", src: `./zebras/light/${key}.jpg` }),
      html("img", {
        class: "image-dark",
        src: `./zebras/dark-v2/${key}.jpg`,
      }),
      // html("div", {}, [key]),
    ]),
  );

  const app = html("div", { class: "app light-mode" }, [
    html("div", { class: "app-header" }, [
      html("div", { class: "app-header-content" }, [
        html("div", { class: "title" }, ["pictures of zebras"]),
        darkModeToggle,
      ]),
    ]),
    html("div", { class: "app-body" }, [
      html("div", { class: "app-body-content" }, [
        html("div", { class: "image-list" }, images),
      ]),
    ]),
  ]);

  return app;
}

document.getElementById("root")!.replaceChildren(App());
