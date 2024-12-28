import { bool, num, str } from "./common.js";

class StorageElement {
    constructor(type, bound_element, bound_element_type, value) {
        this.type = type; // the type of the value (bool, number)
        this.bound_element_type = bound_element_type; // type of the bound element (checkbox, value, content)
        this.bound_element = bound_element; // either a html element (for booleans) or a function
        this.value = value; // the value of the setting
    }

    set_value(value) {
        this.value = value;
    }

    get_value() {
        return this.value;
    }

    update() { // updates @this.bound_element to @this.value based on @this.bound_element_type
        switch (this.bound_element_type) {
            case ("checkbox"): {
                this.bound_element.checked = this.value;
                break;
            }

            case ("value"): {
                this.bound_element.innerText = str(this.value);
                break;
            }

            case ("content"): {
                this.bound_element.innerText = this.value;
                break;
            }

            default: {
                console.error("storage: error while updating value of bound element; unknown storage type \"" + this.type + "\"");
                break;
            }
        }
    }

    load() { // loads @this.value from @this.bound_element based on @this.bound_element_type
        switch (this.bound_element_type) {
            case ("checkbox"): {
                this.value = this.bound_element.checked;
                break;
            }

            case ("value"): {
                switch (this.type) {
                    case ("number"): {
                        this.value = Number(this.bound_element.value);
                        break;
                    }

                    case ("string"): {
                        this.value = str(this.bound_element.value);
                        break;
                    }

                    default: {
                        console.error("storage: error while updating storage value from bound element; unknown storage type \"" + this.type + "\"");
                        break;
                    }
                }

                break;
            }

            case ("content"): {
                switch (this.type) {
                    case ("bool"): {
                        this.value = bool(this.bound_element.innerText);
                        break;
                    }

                    case ("number"): {
                        this.value = num(this.bound_element.innerText);
                        break;
                    }

                    case ("string"): {
                        this.value = str(this.bound_element.innerText);
                        break;
                    }

                    default: {
                        console.error("storage: error while updating storage value from bound element; unknown storage type \"" + this.type + "\"");
                        break;
                    }
                }

                break;
            }

            default: {
                console.error("storage: error while reading value from element; unknown bound element type \"" + this.bound_element_type + "\"");
                break;
            }
        }
    }

    pack() { // converts @this.value to a string
        switch (this.type) {
            case ("bool"): case ("number"): {
                return str(this.value);
            }

            case ("string"): {
                return this.value;
            }

            default: {
                console.error("storage: error while packing value; unknown storage type \"" + this.type + "\"");
                return "null";
            }
        }
    }

    unpack(value) { // converts @value to the desired type indicated by @this.type
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
                    return num(value);
                }
            }

            case ("string"): {
                if (value === undefined || value === null) {
                    return "";
                } else {
                    return value;
                }
            }

            default: {
                console.error("storage: error while unpacking value; unknown storage type \"" + this.type + "\"");
                return undefined;
            }
        }
    }
}

export class Storage {
    constructor() {
        this.storage = new Map();

        this.has_saved_data = localStorage.getItem("storage_has_saved_data") === "true";
        localStorage.setItem("storage_has_saved_data", "true");
    }

    // Register

    register_bool(item_name, bound_element, bound_type, default_value = false) {
        this.storage.set(item_name, new StorageElement("bool", bound_element, bound_type, default_value));
    }

    register_number(item_name, bound_element, bound_type, default_value = 0) {
        this.storage.set(item_name, new StorageElement("number", bound_element, bound_type, default_value));
    }

    register_string(item_name, bound_element, bound_type, default_value = "") {
        this.storage.set(item_name, new StorageElement("string", bound_element, bound_type, default_value));
    }

    // Store & Load

    update() {
        for (const [item_name, storage_item] of this.storage) {
            storage_item.load();
            localStorage.setItem(item_name, storage_item.pack());
        }
    }

    store() {
        for (const [item_name, storage_item] of this.storage) {
            localStorage.setItem(item_name, storage_item.pack());
        }
    }

    load() {
        for (const [item_name, storage_item] of this.storage) {
            const item = localStorage.getItem(str(item_name));

            if (item !== undefined && item !== null) {
                storage_item.set_value(storage_item.unpack(item));
                storage_item.update();
            }
        }
    }

    // Getter & Setter

    get(item_name) {
        const setting = this.storage.get(item_name);
        return (setting === undefined || setting === null) ? undefined : setting.get_value();
    }

    set(item_name, value) {
        this.storage.get(item_name).set_value(value);
    }
}
