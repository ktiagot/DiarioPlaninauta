import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faPlay,
  faRocket,
  faTableTennisPaddleBall,
} from '@fortawesome/free-solid-svg-icons';

export function registerFontAwesomeIcons(library: FaIconLibrary): void {
  library.addIcons(faRocket, faPlay, faTableTennisPaddleBall);
}
