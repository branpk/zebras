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
  "5dm83Xga",
  "32zgzxZd",
  "80NPHpZ6",
  "bS1WqnzE",
  "DmXfJ9lt",
  "dtJlqi7L",
  "eZfrguVj",
  "FZjRUnLW",
  "HzrMFIp7",
  "ijOSySK4",
  "IJVW9F1G",
  "K6alOenI",
  "Lcdj0712",
  "mfAGI3rU",
  "o6yVUfPB",
  "Q8wbPlSy",
  "qb4dfkoJ",
  "qUXGHIrO",
  "r5xAUZEK",
  "W6DXchRX",
  "wlKqmQP1",
  "ZPlkjtvi",
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
      html("img", { class: "image-dark", src: `./zebras/dark/${key}.jpg` }),
      html("img", { class: "image-light", src: `./zebras/light/${key}.jpg` }),
    ]),
  );

  const app = html("div", { class: "app light-mode" }, [
    html("div", { class: "app-header" }, [
      html("div", { class: "title" }, ["pictures of zebras"]),
      darkModeToggle,
    ]),
    html("div", { class: "app-body" }, [
      html("div", { class: "image-list" }, images),
    ]),
  ]);

  return app;
}

document.getElementById("root")!.replaceChildren(App());
