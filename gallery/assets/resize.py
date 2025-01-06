import os
from PIL import Image, ImageOps

def resize_images(input_folder_path, output_folder_path, resize_factor):
    if not os.path.exists(input_folder_path):
        print(f"the folder \"{input_folder_path}\" does not exist.")
        return

    if not os.path.exists(output_folder_path):
        os.makedirs(output_folder_path)

    for filename in os.listdir(input_folder_path):
        file_path = os.path.join(input_folder_path, filename)

        if os.path.isfile(file_path) and filename.lower().endswith(("png", "jpg", "jpeg", "tiff", "bmp", "gif")):
            try:
                with Image.open(file_path) as image:
                    image_size = (int(image.width // resize_factor), int(image.height // resize_factor))

                    image = image.resize(image_size)
                    image = ImageOps.exif_transpose(image)

                    output_file = os.path.join(output_folder_path, filename)
                    image.save(output_file)
                    print(f"saved resized image (\"{file_path}\") to \"{output_file}\".")
            except Exception as error:
                print(f"failed to process \"{filename}\": {error}")

# resize images

print()
print("starting...")
print()

resize_factor = 8
resize_images("images_1x/", f"images_{resize_factor}x", resize_factor)

print()
print("done...")
