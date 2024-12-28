import { Storage } from "./storage.js";

////////////////////////////////
// Global Variables           //
////////////////////////////////

let storage = null;
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

export function element_add_event(event, element, function_callback) {
    element.addEventListener(event, function_callback);
}

export function add_event(event, element_id, function_callback) {
    element_add_event(event, document.getElementById(element_id), function_callback);
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
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    prefers_dark_mode = media.matches;
    variables = getComputedStyle(document.querySelector(":root"));

    // register storage

    storage = new Storage();

    const element_dark_mode_button = document.getElementById("button_dark_mode");
    if (element_dark_mode_button !== undefined && element_dark_mode_button !== null) {
        storage.register_bool("setting_dark_mode", element_dark_mode_button, "checkbox");
        element_add_event("click", element_dark_mode_button, function() { storage.update(); storage.store(); });

        if (!storage.has_saved_data) {
            element_dark_mode_button.checked = prefers_dark_mode;
            element_update(element_dark_mode_button);

            storage.update();
            storage.store();

            console.log("saved");
        }
    }

    media.addEventListener("change", event => {
        prefers_dark_mode = event.matches;
    });
});
