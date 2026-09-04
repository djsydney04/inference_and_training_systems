import "./styles.css";
import { atlasMarkup } from "./content";
import { initializeInteractions } from "./interactions";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("Atlas root element is missing");

app.innerHTML = atlasMarkup;

initializeInteractions();

void import("./scenes").then(({ initializeScenes }) => initializeScenes());
