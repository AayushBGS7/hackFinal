import traceback
import numpy as np
import torch
import torchxrayvision as xrv
from PIL import Image

img = Image.open('test_samples/sample_xray.png').convert('L')
arr = np.array(img, dtype=np.float32)
print('array ok', arr.shape, arr.dtype)

try:
    norm = xrv.datasets.normalize(arr, maxval=255, reshape=True)
    print('normalize ok', type(norm), norm.shape)
except Exception as e:
    traceback.print_exc()
    # Try manual normalize
    print("\nTrying manual normalization...")
    norm = (arr / 255.0 * 2048) - 1024
    norm = norm[np.newaxis, :, :]  # Add channel dimension
    print('manual normalize ok', norm.shape, norm.dtype)

try:
    from torchvision import transforms
    transform = transforms.Compose([
        xrv.datasets.XRayCenterCrop(),
        xrv.datasets.XRayResizer(224),
    ])
    img_tensor = transform(torch.from_numpy(norm))
    print('transform ok', img_tensor.shape)
    img_tensor = img_tensor.unsqueeze(0)
    print('batch ok', img_tensor.shape)
except Exception as e:
    traceback.print_exc()

