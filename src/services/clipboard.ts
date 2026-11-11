import * as Clipboard from 'expo-clipboard';
import { log } from '../utils/log';

// Copies the text to the clipboard. Returns false when it could not (the screen then shows the text to copy by hand).
export const copyText = async (text: string) => {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    log.warn('Could not copy to the clipboard', error);
    return false;
  }
};
