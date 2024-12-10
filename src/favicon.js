import { get_css_variable, user_prefers_dark_mode } from "./common.js";

function set_favicon(dark_mode_preferred) {
    const favicon_data = document.getElementById("favicon_data");

    // dark/light mode

    let light_mode_favicon_color = get_css_variable("--light_mode_color_favicon");
    let dark_mode_favicon_color = get_css_variable("--dark_mode_color_favicon");
    let favicon_color = dark_mode_preferred ? dark_mode_favicon_color : light_mode_favicon_color;

    // set a favicon

    if (favicon_data != null) {
        const svg_string = favicon_data.innerHTML;

        // parse the svg

        let dom_parser = new DOMParser();

        let svg_document = dom_parser.parseFromString(svg_string, "image/svg+xml");
        let paths = svg_document.querySelectorAll("path");

        for (let path of paths) {
            path.setAttribute("fill", favicon_color);
        }

        // serialize the svg document back to a string & update favicon

        const favicon = document.head.querySelector("link[rel=\"icon\"]");
        if (favicon != null) {
            let result = (new XMLSerializer()).serializeToString(svg_document).replace('\"', "%22").replace('#', "%23");
            favicon.href = "data:image/svg+xml," + result;
        }
    }
}

////////////////////////////////
// Main Function              //
////////////////////////////////

document.addEventListener("DOMContentLoaded", async function() {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
        set_favicon(event.matches);
    });

    set_favicon(user_prefers_dark_mode());
});
