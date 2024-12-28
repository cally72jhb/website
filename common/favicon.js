import { get_css_variable, user_prefers_dark_mode, get_file_content } from "./common.js";

async function set_favicon(dark_mode_preferred) {
    const favicon_data = document.getElementById("favicon_data");
    const child_tag = favicon_data.firstElementChild.tagName.toLowerCase();
    let svg_string = "";

    if (child_tag === "object") {
        const object_data = favicon_data.firstElementChild.getAttribute("data");
        if (object_data !== null && object_data !== undefined) {
            svg_string = await get_file_content(object_data);
        } else {
            return;
        }
    } else if (child_tag === "svg") {
        svg_string = favicon_data.innerHTML;
    } else {
        return;
    }

    // dark/light mode colors

    let light_mode_favicon_color = get_css_variable("--light_mode_color_favicon");
    let dark_mode_favicon_color = get_css_variable("--dark_mode_color_favicon");
    let favicon_color = dark_mode_preferred ? dark_mode_favicon_color : light_mode_favicon_color;

    // parse the svg

    let dom_parser = new DOMParser();

    let svg_document = dom_parser.parseFromString(svg_string, "image/svg+xml");
    let paths = svg_document.querySelectorAll("path, rect, circle");

    for (let path of paths) {
        let has_property = false;

        if (path.getAttribute("stroke") !== null) {
            path.setAttribute("stroke", favicon_color);
            has_property = true;
        }

        if (path.getAttribute("fill") !== null) {
            path.setAttribute("fill", favicon_color);
            has_property = true;
        }

        if (!has_property) {
            path.setAttribute("fill", favicon_color); /* on some svgs there is no color set meaning we are assuming the shape must be filled; might result in weird shapes */
        }
    }

    // serialize the svg document back to a string & update favicon

    const favicon = document.head.querySelector("link[rel=\"icon\"]");
    if (favicon != null) {
        let result = (new XMLSerializer()).serializeToString(svg_document).replaceAll('\"', "%22").replaceAll('#', "%23");
        favicon.href = "data:image/svg+xml," + result;
    }
}

////////////////////////////////
// Main Function              //
////////////////////////////////

document.addEventListener("DOMContentLoaded", async function() {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
        set_favicon(event.matches);
    });

    await set_favicon(user_prefers_dark_mode());
});
