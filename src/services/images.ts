import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { fitSize } from '../utils/image-size';

// Shrinks a photo before upload: keeps the proportion, caps the longest side and re-encodes as JPEG
export const resizeForUpload = async (uri: string, width: number, height: number) => {
  const size = fitSize(width, height);
  const image = await ImageManipulator.manipulate(uri).resize(size).renderAsync();
  const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return saved.uri;
};
