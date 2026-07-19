import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

/**
 * `/` slash-command extension. Items + render are supplied by the editor so the
 * menu can close over things like the image-upload handler.
 */
export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }) => props.command({ editor, range }),
      },
    };
  },

  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })];
  },
});
