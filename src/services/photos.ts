import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { log } from '../utils/log';
import { storage } from './firebase';
import { resizeForUpload } from './images';

export type PhotoFolder = 'profile' | 'gallery' | 'services';

// Uploads a photo of the professional (shrunk first) and returns its public URL
export const uploadPhoto = async (
  uid: string,
  folder: PhotoFolder,
  photo: { uri: string; width: number; height: number },
) => {
  const uri = await resizeForUpload(photo.uri, photo.width, photo.height);
  const blob = await (await fetch(uri)).blob();
  const target = ref(storage, `professionals/${uid}/${folder}/${Date.now()}.jpg`);
  await uploadBytes(target, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(target);
};

// Deletes a photo by its URL. Links that aren't from our bucket are ignored.
export const removePhoto = async (url: string) => {
  try {
    await deleteObject(ref(storage, url));
  } catch (error) {
    log.warn('Could not delete photo', error);
  }
};
