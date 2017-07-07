const didIncludes = require("./index");

didIncludes.build((error) => {
    if(error) {
        return console.error("Failed to properly build bundles", error);
    }
    console.log("Succesfully finished building bundles.");
});
