let first_time_visited = false;
let variables = null;

let prefers_dark_mode = false;

////////////////////////////////
// Common Function            //
////////////////////////////////

export function str(value) {
    return String(value);
}

export function num(value) {
    return Number(value);
}

export function bool(value) {
    return ["true", "1"].includes(value);
}

export function website_first_time_visited() {
    return first_time_visited;
}

export function get_css_variable(identifier) {
    return variables.getPropertyValue(identifier).trim();
}

export function user_prefers_dark_mode() {
    return prefers_dark_mode;
}

export function element_update(element) {
    const prev_display = element.style.display;
    element.style.display = "none";
    element.offsetHeight; // this forces reflow
    element.style.display = prev_display;
}

export function element_animations_finished(element) {
    const animations = element.getAnimations();
    for (const animation of animations) {
        if (animation.playState !== "finished") {
            return false;
        }
    }

    return true;
}

export function add_event(event, element_id, function_callback) {
    document.getElementById(element_id).addEventListener(event, function_callback);
}

export function add_click_event(element_id, function_callback) {
    add_event("click", element_id, function_callback);
}

export function add_change_event(element_id, function_callback) {
    add_event("change", element_id, function_callback);
}

export function feedback_vibrate(milliseconds) {
    try {
        navigator.vibrate(milliseconds);
    } catch (exception) { }
}

export async function get_file_content(file_path) {
    try {
        const response = await fetch(file_path);
        if (!response.ok) {
            throw new Error("response was not successful: " + response.statusText);
        }

        return await response.text();
    } catch (error) {
        console.error("error fetching file at \"" + file_path + "\": " + error);
        throw error;
    }
}

////////////////////////////////
// Main Function              //
////////////////////////////////

document.addEventListener("DOMContentLoaded", async function() {
    first_time_visited = !document.cookie.includes("visited");
    document.cookie = "visited=true; SameSite=Strict; Secure; path=/";

    variables = getComputedStyle(document.querySelector(":root"));

    // @prefers_dark_mode

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    prefers_dark_mode = media.matches;
    if (prefers_dark_mode && website_first_time_visited()) { // update dark mode the first time the website was loaded
        const element_dark_mode_button = document.getElementById("button_dark_mode");
        element_dark_mode_button.checked = true;
        element_update(element_dark_mode_button);
    }

    media.addEventListener("change", event => {
        prefers_dark_mode = event.matches;
    });
});
