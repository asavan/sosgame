import PACKAGE from "../package.json" with { type: "json" };
import {webpackProd} from "netdeps";

const prodConfig = () => {
    return webpackProd(PACKAGE.version);
};

export default prodConfig;
