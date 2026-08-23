import "./main.css";
import sunIcon from "./assets/sun.svg";
import moonIcon from "./assets/moon.svg";

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

const IMAGES: [string, [number, number]][] = [
  ["wlKqmQP1", [1536, 1024]],
  ["HzrMFIp7", [1536, 1024]],
  ["ijOSySK4", [1448, 1086]],
  ["eZfrguVj", [1536, 1024]],
  ["Q8wbPlSy", [1493, 1053]],
  ["K6alOenI", [1536, 1024]],
  ["r5xAUZEK", [1537, 1023]],
  ["qUXGHIrO", [1537, 1023]],
  ["W6DXchRX", [1023, 1537]],
  ["5dm83Xga", [1122, 1402]],
  ["IJVW9F1G", [1533, 1026]],
  ["80NPHpZ6", [1023, 1537]],
  ["bS1WqnzE", [1430, 1100]],
  ["Lcdj0712", [1122, 1402]],
  ["FZjRUnLW", [1606, 979]],
  ["o6yVUfPB", [1536, 1024]],
  ["qb4dfkoJ", [1537, 1023]],
  ["mfAGI3rU", [1536, 1024]],
  ["32zgzxZd", [1023, 1537]],
  ["dtJlqi7L", [1055, 1491]],
  ["ZPlkjtvi", [1023, 1537]],
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
  };

  const darkModeToggle = html(
    "button",
    { class: "dark-mode-toggle" },
    [
      html("span", { class: "toggle-thumb" }),
      html("span", {
        class: "light-icon",
        style: `background-image: url("${sunIcon}")`,
      }),
      html("span", {
        class: "dark-icon",
        style: `background-image: url("${moonIcon}")`,
      }),
    ],
    {
      click: toggleDarkMode,
    },
  );

  const images = IMAGES.map(([key, [width, height]]) =>
    html("div", { class: "image-wrapper" }, [
      html("img", {
        class: "image-light",
        src: `./zebras/light-resized/${key}.jpg`,
        loading: "lazy",
        width: `${width}px`,
        height: `${height}px`,
      }),
      html("img", {
        class: "image-dark",
        src: `./zebras/dark-v2/${key}.jpg`,
        loading: "lazy",
        width: `${width}px`,
        height: `${height}px`,
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
