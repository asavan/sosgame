import { webpackDev } from "devdeps";
import settings from "../src/js/settings.js";

const devConfig = () => webpackDev([], settings);

export default devConfig;
