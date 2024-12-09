function str(value) {
    return (("") + (value));
}

function feedback_vibrate(milliseconds) {
    try {
        navigator.vibrate(milliseconds);
    } catch (exception) { }
}

async function get_file_content(file_path) {
    let result = "";
    await fetch(file_path).then((response) => response.text()).then((text) => {
        result = text;
    }).catch((error) => {
        console.error("error fetching file at \"" + file_path + "\": " + error);
        result = "";

        const request = new XMLHttpRequest();
        request.open("GET", file_path, true);
        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    result = request.responseText;
                } else {
                    console.error("error fetching file at \"" + file_path + "\"");
                }
            }
        };

        request.send();
    });

    return result;
}

async function get_resource(resource_path) {
    return await get_file_content("../../resources/" + resource_path);
}

function element_update(element) {
    const prev_display = element.style.display;
    element.style.display = "none";
    element.offsetHeight; // this forces reflow
    element.style.display = prev_display;
}

function element_animations_finished(element) {
    const animations = element.getAnimations();
    for (const animation of animations) {
        if (animation.playState !== "finished") {
            return false;
        }
    }

    return true;
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

let variables = null; // variables defined in :root
let dark_mode_preferred = false;
let first_time_visited = false;

let game_state = null; // keeps track of the current game state

////////////////////////////////
// Settings                   //
////////////////////////////////

class SettingValue {
    constructor(type, bound_element, value) {
        this.type = type; // the type of the value (bool, number, object, map)
        this.bound_element = bound_element; // either a html element (for booleans) or a function
        this.value = value; // the value of the setting
    }

    set_value(value) {
        this.value = value;
    }

    get_value() {
        return this.value;
    }

    load() {
        switch (this.type) {
            case ("bool"): case ("number"): {
                this.bound_element.innerText = str(this.value);
                break;
            }

            default: {
                break;
            }
        }
    }

    pack() {
        switch (this.type) {
            case ("bool"): case ("number"): {
                return str(this.value);
            }

            default: {
                return "null";
            }
        }
    }

    unpack(value) {
        switch (this.type) {
            case ("bool"): {
                if (value === undefined || value === null) {
                    return false;
                } else {
                    return ["true", "1"].includes(value);
                }
            }

            case ("number"): {
                if (value === undefined || value === null) {
                    return 0;
                } else {
                    return Number(value);
                }
            }

            default: {
                return undefined;
            }
        }
    }
}

class Settings {
    constructor() {
        this.settings = new Map();
    }

    // Register

    register_bool_setting(setting_name, bound_element) {
        this.settings.set(setting_name, new SettingValue("bool", bound_element, false));
    }

    register_number_setting(setting_name, bound_element) {
        this.settings.set(setting_name, new SettingValue("number", bound_element, 0));
    }

    // Store & Load

    store() {
        for (const [setting_name, setting_value] of this.settings) {
            localStorage.setItem(setting_name, setting_value.pack());
        }
    }

    load() {
        for (const [setting_name] of this.settings) {
            const setting = this.settings.get(setting_name);
            setting.set_value(setting.unpack(localStorage.getItem(str(setting_name))));
            setting.load();
        }
    }

    // Getter & Setter

    get(setting_name) {
        const setting = this.settings.get(setting_name);
        return (setting === undefined || setting === null) ? undefined : setting.get_value();
    }

    set(setting_name, value) {
        this.settings.get(setting_name).set_value(value);
    }
}

const settings = new Settings();

let setting_sequences = null;
let setting_selected_sequence = null;
let setting_uploaded_files = null;

function register_settings() {
    const element_setting_screen_shake = document.getElementById("setting_screen_shake");
    const element_setting_hearths      = document.getElementById("setting_hearths");
    const element_setting_vibrations   = document.getElementById("setting_vibrations");
    const element_setting_confetti     = document.getElementById("setting_confetti");

    // register settings

    settings.register_bool_setting("setting_screen_shake", element_setting_screen_shake);
    settings.register_bool_setting("setting_hearths", element_setting_hearths);
    settings.register_bool_setting("setting_vibrations", element_setting_vibrations);
    settings.register_bool_setting("setting_confetti", element_setting_confetti);

    setting_sequences = [ "Euler's Number", "PI", "Square Root of 2" ];
    setting_selected_sequence = setting_sequences[0];
    setting_uploaded_files = new Map();
}

function store_setting() {
    settings.store();

    // TODO: store uploaded files & selected sequence
}

function load_settings() {
    settings.load();
}

////////////////////////////////
// Other Functions            //
////////////////////////////////

function set_favicon() {
    const favicon_data = document.getElementById("favicon_data");

    // dark/light mode

    let light_mode_favicon_color = variables.getPropertyValue("--light_mode_color_favicon").trim();
    let dark_mode_favicon_color = variables.getPropertyValue("--dark_mode_color_favicon").trim();
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

function play_confetti_animation() {
    if (!settings.get("setting_confetti")) {
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
    constructor() {
        this.number_sequence = ""; // the current active number sequence
        this.start_index = 0; // the index to the start of the number (typically the index after the decimal separator)
        this.current_index = 0; // the index of the current digit

        this.prev_high_score = 0;
        this.animation_played = false;
        this.high_score = 0; // the users highest score

        this.hearths = 0; // how many lives are left

        // get elements

        this.element_screen = document.getElementById("screen_content");

        this.element_hearths = document.getElementById("hearths");

        this.element_high_score = document.getElementById("high_score");
        this.element_current_score = document.getElementById("current_score");

        this.color_red = variables.getPropertyValue("--color_red").trim();
        this.color_green = variables.getPropertyValue("--color_green").trim();
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
            localStorage.setItem("high_score", score); // TODO: move elsewhere
        }

        this.element_high_score.innerText    = str(this.high_score);
        this.element_current_score.innerText = str(score);
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
        this.reset_hearths();
        this.reset_screen_with_animation();

        this.prev_high_score = this.high_score;
        this.animation_played = false;
    }

    // Input Functions

    input_correct(button) {
        const button_element = document.getElementById("button" + button);
        const color_button = getComputedStyle(button_element).backgroundColor;

        feedback_vibrate(100);

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
        }
    }

    input_wrong(button) {
        const button_element = document.getElementById("button" + button);
        const color_button = getComputedStyle(button_element).backgroundColor;

        feedback_vibrate(300);

        if (settings.get("setting_screen_shake")) {
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

        if (settings.get("setting_hearths")) {
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

    const element_setting_screen_shake = document.getElementById("setting_screen_shake");
    const element_setting_hearths      = document.getElementById("setting_hearths");
    const element_setting_vibrations   = document.getElementById("setting_vibrations");
    const element_setting_confetti     = document.getElementById("setting_confetti");

    settings.set("setting_screen_shake", !element_setting_screen_shake.checked);

    if (element_setting_hearths.checked === false || element_setting_hearths.checked === true && (game_state.current_index - 1) === game_state.start_index) {
        game_state.reset_hearths();
        settings.set("setting_hearths", !element_setting_hearths.checked);
    } else {
        element_setting_hearths.checked = !element_setting_hearths.checked;
    }

    settings.set("setting_vibrations", !element_setting_vibrations.checked);
    settings.set("setting_confetti", !element_setting_confetti.checked);

    store_setting();
}

async function settings_choose_sequence() {
    if (!content_loaded) {
        return;
    }

    const element_selected_sequence = document.getElementById("selected_sequence");

    // update the current sequence

    const index = setting_sequences.indexOf(element_selected_sequence.innerText.trim());
    if (index === -1) { // reached the last element: start over again
        element_selected_sequence.innerText = setting_sequences[0];
        setting_selected_sequence = setting_sequences[0];
    } else {
        let sequence_name;
        if (index === setting_sequences.length - 1) {
            sequence_name = setting_sequences[0];
        } else {
            sequence_name = setting_sequences[index + 1];
        }

        element_selected_sequence.innerText = sequence_name;
        setting_selected_sequence = sequence_name;

        switch (sequence_name) {
            case setting_sequences[0]: {
                game_state.set_number_sequence(await get_resource("e.txt"));
                break;
            }

            case setting_sequences[1]: {
                game_state.set_number_sequence(await get_resource("pi.txt"));
                break;
            }

            case setting_sequences[2]: {
                game_state.set_number_sequence(await get_resource("sqrt_2.txt"));
                break;
            }

            default: {
                if (setting_uploaded_files.has(sequence_name)) {
                    game_state.set_number_sequence(setting_uploaded_files.get(sequence_name));
                }

                break;
            }
        }

        game_state.reset_animation();
    }
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

        const sequences = settings.get("sequences");
        const uploaded_files = settings.get("uploaded_files");

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

    switch (button) {
        case (-1): { // reset button
            feedback_vibrate(250);

            game_state.start_index = 0;
            game_state.current_index = 0;
            game_state.reset();
            break;
        }

        case (0): case (1): case (2): case (3): case (4): case (5): case (6): case (7): case (8): case (9): {
            const character = str(button);
            if (game_state.number_sequence[game_state.current_index] === character) {
                game_state.consume_digit();
                game_state.input_correct(button);
            } else {
                game_state.input_wrong(button);
            }

            break;
        }
    }
}

////////////////////////////////
// Main Function              //
////////////////////////////////

document.addEventListener("DOMContentLoaded", async function() {
    content_loaded = true;

    variables = getComputedStyle(document.querySelector(":root"));

    first_time_visited = !document.cookie.includes("visited");
    document.cookie = "visited=true; SameSite=Strict; Secure; path=/";

    // register settings

    register_settings();

    // update favicon

    dark_mode_preferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark_mode_preferred && first_time_visited) { // update dark mode the first time the website was loaded
        const element_dark_mode_button = document.getElementById("button_dark_mode");
        element_dark_mode_button.checked = true;
        element_update(element_dark_mode_button);
    }

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
        dark_mode_preferred = event.matches;
        set_favicon();
    });

    set_favicon();

    // initialize the game state

    game_state = new GameState();
    game_state.set_number_sequence(await get_resource("e.txt"));

    game_state.reset();

    // get scores from local storage

    game_state.high_score = localStorage.getItem("high_score");
    game_state.update_scores();

    load_settings();
    settings_update();
});
