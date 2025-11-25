from PIL import Image

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color = (29, 161, 242)) # Twitter Blue
    img.save(filename)

create_icon(16, 'icons/icon16.png')
create_icon(48, 'icons/icon48.png')
create_icon(128, 'icons/icon128.png')
print("Icons created.")
