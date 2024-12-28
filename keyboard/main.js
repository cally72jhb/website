import { element_update, feedback_vibrate } from "../common/common.js";

////////////////////////////////
// Global Variables           //
////////////////////////////////

let content_loaded = false;

////////////////////////////////
// Input Callbacks            //
////////////////////////////////

function key_press(event) {
    if (!content_loaded) {
        return;
    }

    let key;
    switch (event.key) {
        case ("Control"): {
            if (event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
                key = "left_control";
            } else if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                key = "right_control";
            } else {
                return;
            }

            break;
        }

        case ("Shift"): {
            if (event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
                key = "left_shift";
            } else if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                key = "right_shift";
            } else {
                return;
            }

            break;
        }

        case ("AltGraph"): { key = "alt_gr"; break; }
        case ("CapsLock"): { key = "caps"; break; }

        case ("Backspace"): { key = "back"; break; }
        case ("Enter"): { key = "return"; break; }

        case (" "): { key = "space"; break; }

        default: {
            key = event.key.toLowerCase();
            break;
        }
    }

    const element_keyboard = document.getElementById("keyboard");
    for (let button of element_keyboard.querySelectorAll(".button")) {
        if (button.getAttribute("data-key") === key || button.innerText.trim().toLowerCase() === key) {
            button.classList.add("active");
            element_update(button);

            setTimeout(function() {
                button.classList.remove("active");
                element_update(button);
            }, 100);

            feedback_vibrate(40);

            event.preventDefault();

            break;
        }
    }
}

////////////////////////////////
// Main Function              //
////////////////////////////////

document.addEventListener("DOMContentLoaded", async function() {
    content_loaded = true;

    // add event listeners

    document.addEventListener("keydown", key_press);
});
