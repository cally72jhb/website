import { str, get_css_variable, element_update, element_animations_finished, add_click_event, add_change_event, feedback_vibrate, get_file_content } from "../common/common.js";
import { Storage } from "../common/storage.js";

async function get_resource(resource_path) {
    return await get_file_content("../src/resources/" + resource_path);
}

////////////////////////////////
// Constants                  //
////////////////////////////////

const hearth_count_max = 3;
const sequence_const_e = "2.7182818284590452353602874713526624977572470936999595749669676277";

////////////////////////////////
// Global Variables           //
////////////////////////////////

let content_loaded = false;

let game_state = null; // keeps track of the current game state

////////////////////////////////
// Settings                   //
////////////////////////////////

let storage = null;

let setting_sequences = null;
let setting_uploaded_files = null;

function register_storage() {
    const element_setting_screen_shake = document.getElementById("setting_screen_shake");
    const element_setting_hearths      = document.getElementById("setting_hearths");
    const element_setting_vibrations   = document.getElementById("setting_vibrations");
    const element_setting_confetti     = document.getElementById("setting_confetti");

    const element_current_score = document.getElementById("current_score");
    const element_high_score    = document.getElementById("high_score");

    const element_selected_sequence = document.getElementById("selected_sequence");

    // settings

    setting_sequences = [ "Euler's Number", "PI", "Square Root of 2" ];
    setting_uploaded_files = new Map();

    // register storage items

    storage.register_bool("setting_screen_shake", element_setting_screen_shake, "checkbox");
    storage.register_bool("setting_hearths", element_setting_hearths, "checkbox");
    storage.register_bool("setting_vibrations", element_setting_vibrations, "checkbox");
    storage.register_bool("setting_confetti", element_setting_confetti, "checkbox");

    storage.register_number("current_score", element_current_score, "content");
    storage.register_number("high_score", element_high_score, "content");

    storage.register_string("selected_sequence", element_selected_sequence, "content", setting_sequences[0]);
}

function storage_store() {
    storage.store(); // TODO: store uploaded files & selected sequence
}

function storage_load() {
    storage.load();
}

////////////////////////////////
// Other Functions            //
////////////////////////////////

function play_confetti_animation() {
    if (!storage.get("setting_confetti")) {
        return;
    }

    const overlay = document.getElementById("overlay");

    // check if the animation is still playing

    for (const child of overlay.children) {
        if (!element_animations_finished(child)) {
            return;
        }
    }

    // start/replay the animation

    for (const child of overlay.children) {
        child.classList.remove("confetti");
        element_update(child);
        child.classList.add("confetti");
    }
}

////////////////////////////////
// Game Functions             //
////////////////////////////////

class GameState {
    constructor(stored_current_score, stored_high_score, number_sequence) {
        this.number_sequence = number_sequence; // the current active number sequence
        this.start_index = 0; // the index to the start of the number (typically the index after the decimal separator)
        this.current_index = 0; // the index of the current character in @number_sequence

        this.prev_high_score = 0;
        this.animation_played = false;
        this.high_score = stored_high_score; // the users highest score

        this.hearths = 0; // how many lives are left

        // get elements

        this.element_screen = document.getElementById("screen_content");

        this.element_hearths = document.getElementById("hearths");

        this.element_high_score = document.getElementById("high_score");
        this.element_current_score = document.getElementById("current_score");

        this.color_red = get_css_variable("--color_red");
        this.color_green = get_css_variable("--color_green");

        // reset & update the screen to the stored score

        this.reset();

        if (stored_current_score > 1) {
            this.current_index = this.start_index + stored_current_score;

            this.clear_screen();
            this.print_to_screen(this.number_sequence.substring(0, this.current_index));

            this.update_screen();
            this.update_scores();
        }
    }

    // Getter

    get_score() {
        return this.current_index - this.start_index;
    }

    // Setter

    set_number_sequence(new_sequence) {
        if (new_sequence === "") {
            this.number_sequence = sequence_const_e;
        } else {
            this.number_sequence = new_sequence;
        }
    }

    // Screen Functions

    print_to_screen(string) {
        this.element_screen.innerText += string;
    }

    update_screen() {
        const cursor = document.getElementById("cursor").firstChild;
        if (cursor !== undefined) {
            cursor.innerText = this.current_index >= this.number_sequence.length ? 'x' : this.number_sequence[this.current_index];
        }
    }

    update_scores() {
        const score = this.get_score();
        if (this.high_score < score) {
            this.high_score = score;
            storage.set("high_score", this.high_score);
        }

        this.element_high_score.innerText    = str(this.high_score);
        this.element_current_score.innerText = str(score);

        storage.set("current_score", score);
        storage.store();
    }

    consume_digit() {
        if (this.current_index < this.number_sequence.length) {
            this.print_to_screen(this.number_sequence[this.current_index++]);
        } else {
            this.print_to_screen('.');
        }

        this.update_screen();
        this.update_scores();
    }

    // Reset Functions

    reset_hearths() {
        this.hearths = 3;
        for (const child of this.element_hearths.children) {
            child.classList.remove("animation_hearth_pop");
        }
    }

    clear_screen() {
        this.element_screen.innerText = "";
    }

    reset_screen() {
        const first_digit_index = this.number_sequence.indexOf('.'); // if the number doesn't have a decimal separator, only one digit is going to be printed at the beginning

        this.element_screen.innerText = this.number_sequence.substring(0, first_digit_index + 1);

        this.start_index = first_digit_index + 1;
        this.current_index = this.start_index;

        this.consume_digit();
    }

    reset_screen_with_animation() {
        const decimal_separator_index = this.number_sequence.indexOf('.');
        const first_digit_index = decimal_separator_index === -1 ? 1 : decimal_separator_index;

        let speed = 200;
        const speed_max = 2;
        let acceleration;
        if (this.element_screen.innerText.length < 5) {
            speed = speed_max;
            acceleration = 0;
        } else {
            acceleration = Math.max(200 / (this.element_screen.innerText.length + 1) + 20, 25);
        }

        const temp_game_state = this; // interface for accessing game state variables and functions
        function remove_character() {
            if (temp_game_state.element_screen.innerText.length > first_digit_index + 2) {
                speed -= acceleration;
                speed = speed < speed_max ? speed_max : speed;

                temp_game_state.element_screen.innerText = temp_game_state.element_screen.innerText.slice(0, -1);

                temp_game_state.current_index--;
                temp_game_state.update_scores();
                feedback_vibrate(25);
                setTimeout(remove_character, speed);
            } else {
                temp_game_state.reset_screen();
                temp_game_state.hearths = 3; // update hearths early to prevent bugs
                setTimeout(function() {
                    temp_game_state.reset();
                }, 50);
            }
        }

        setTimeout(remove_character, 500);
    }

    reset() {
        this.reset_hearths();
        this.reset_screen();

        this.prev_high_score = this.high_score;
        this.animation_played = false;
    }

    reset_animation() {
        if (this.get_score() <= 4) {
            this.reset();
            return;
        }

        this.reset_hearths();
        this.reset_screen_with_animation();

        this.prev_high_score = this.high_score;
        this.animation_played = false;
    }

    // Input Functions

    input_correct(button) {
        const button_element = document.getElementById("button" + button);
        const color_button = getComputedStyle(button_element).backgroundColor;

        button_element.animate(
            [
                { background: this.color_green },
                { background: color_button }
            ], {
                duration: 225,
                easing: "ease-in-out"
            }
        )

        if (this.prev_high_score > 1 && !this.animation_played && this.get_score() > this.prev_high_score) {
            this.animation_played = true;
            feedback_vibrate(100);
            play_confetti_animation();
        } else {
            feedback_vibrate(45);
        }
    }

    input_wrong(button) {
        const button_element = document.getElementById("button" + button);
        const color_button = getComputedStyle(button_element).backgroundColor;

        feedback_vibrate(55);

        if (storage.get("setting_screen_shake")) {
            this.element_screen.animate(
                [
                    { transform: "translateX(0)    translateY(0)"    },
                    { transform: "translateX(8px)  translateY(0)"    },
                    { transform: "translateX(-8px) translateY(8px)"  },
                    { transform: "translateX(4px)  translateY(-4px)" },
                    { transform: "translateX(0)    translateY(-8px)" },
                ], {
                    duration: 100
                }
            );
        }

        button_element.animate(
            [
                { backgroundColor: this.color_red },
                { backgroundColor: color_button }
            ], {
                duration: 225,
                easing: "ease-in-out"
            }
        )

        if (storage.get("setting_hearths")) {
            if (this.hearths === 0) {
                this.reset_animation();
            } else {
                this.element_hearths.children[hearth_count_max - this.hearths].classList.add("animation_hearth_pop");
                this.hearths--;
            }
        }
    }
}

////////////////////////////////
// Input Callbacks            //
////////////////////////////////

function settings_update() {
    if (!content_loaded) {
        return;
    }

    // prevent the user from disabling lives during games

    const element_setting_hearths = document.getElementById("setting_hearths");
    if (element_setting_hearths.checked || element_setting_hearths.checked === false && (game_state.current_index - 1) === game_state.start_index) {
        game_state.reset_hearths();
    } else {
        element_setting_hearths.checked = !element_setting_hearths.checked;
    }

    // load the current settings from each bound element and store them

    storage.update();
    storage_store();
}

async function get_sequence(sequence_name) {
    switch (sequence_name) {
        case setting_sequences[0]: { return await get_resource("e.txt"); }
        case setting_sequences[1]: { return await get_resource("pi.txt"); }
        case setting_sequences[2]: { return await get_resource("sqrt_2.txt"); }

        default: {
            if (setting_uploaded_files.has(sequence_name)) {
                return setting_uploaded_files.get(sequence_name);
            }

            break;
        }
    }

    return undefined;
}

async function select_sequence(sequence_name) { // requires a manual reset of the screen afterwards
    const element_selected_sequence = document.getElementById("selected_sequence");

    element_selected_sequence.innerText = sequence_name;
    storage.set("selected_sequence", sequence_name);

    game_state.set_number_sequence(await get_sequence(sequence_name));
}

async function settings_choose_sequence() {
    if (!content_loaded) {
        return;
    }

    const element_selected_sequence = document.getElementById("selected_sequence");

    // update the current sequence

    const index = setting_sequences.indexOf(element_selected_sequence.innerText.trim());
    if (index === -1) { // reached the last element: start over again
        await select_sequence(setting_sequences[0]);
    } else {
        let sequence_name;
        if (index === setting_sequences.length - 1) {
            sequence_name = setting_sequences[0];
        } else {
            sequence_name = setting_sequences[index + 1];
        }

        await select_sequence(sequence_name);
    }

    game_state.reset_animation();

    storage.store();
}

function settings_choose_file(event) {
    if (!content_loaded) {
        return;
    }

    const element_selected_sequence = document.getElementById("selected_sequence");

    const file = event.target.files[0];
    if (file === undefined || file === null) {
        return;
    }

    // read file content

    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;

        // store file content for usage

        const sequences = storage.get("sequences");
        const uploaded_files = storage.get("uploaded_files");

        sequences.push(file.name);
        uploaded_files.set(file.name, content);

        element_selected_sequence.innerText = file.name; // TODO
        game_state.set_number_sequence(content);

        game_state.reset();
    };

    reader.readAsText(file);
}

function button_press(button) {
    if (!content_loaded) {
        return;
    }

    const character = str(button);
    if (game_state.number_sequence[game_state.current_index] === character) {
        game_state.consume_digit();
        game_state.input_correct(button);
    } else {
        game_state.input_wrong(button);
    }
}

function button_press_reset() {
    if (!content_loaded) {
        return;
    }

    feedback_vibrate(75);

    game_state.start_index = 0;
    game_state.current_index = 0;
    game_state.reset();
}

function key_press(event) {
    if (!content_loaded) {
        return;
    }

    const key = event.key;

    if (key >= '0' && key <= '9') {
        button_press(key - '0');
        event.preventDefault();
    } else if (key === 'v') {
        const button = document.getElementById("button_visibility");
        button.checked = !button.checked;
    }
}

////////////////////////////////
// Main Function              //
////////////////////////////////

document.addEventListener("DOMContentLoaded", async function() {
    content_loaded = true;

    // register storage

    storage = new Storage();

    register_storage();
    storage_load();

    // add event listeners

    for (let i = 0; i < 10; i++) {
        add_click_event("button" + i, function() {
            button_press(i);
        });
    }

    add_click_event("button_reset", function() { button_press_reset(); });
    document.addEventListener("keydown", key_press);

    add_click_event("setting_sequence", function() { settings_choose_sequence(); });
    add_change_event("file_upload", function(event) { settings_choose_file(event); });

    add_click_event("setting_screen_shake", function() { settings_update(); });
    add_click_event("setting_hearths",      function() { settings_update(); });
    add_click_event("setting_vibrations",   function() { settings_update(); });
    add_click_event("setting_confetti",     function() { settings_update(); });

    // initialize the game state

    game_state = new GameState(
        storage.get("current_score"),
        storage.get("high_score"),
        await get_sequence(storage.get("selected_sequence"))
    );

    settings_update();
});
