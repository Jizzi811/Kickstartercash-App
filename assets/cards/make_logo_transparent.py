#!/usr/bin/env python3
"""Remove white background from KickstarterCash logo."""
from PIL import Image
import numpy as np

img = Image.open('/home/user/Kickstartercash-App/assets/cards/card_9.png').convert('RGBA')
data = np.array(img)

# White pixels (R>240, G>240, B>240) → transparent
r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
white_mask = (r > 235) & (g > 235) & (b > 235)
data[white_mask, 3] = 0

result = Image.fromarray(data)
result.save('/home/user/Kickstartercash-App/assets/cards/logo_transparent.png')
print('Saved logo_transparent.png')
