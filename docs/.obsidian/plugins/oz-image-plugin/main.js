/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/

'use strict';

var obsidian = require('obsidian');

// Remove Widgets in CodeMirror Editor
const clearWidgets = (cm) => {
    var lastLine = cm.lastLine();
    for (let i = 0; i <= lastLine; i++) {
        const line = cm.lineInfo(i);
        clearLineWidgets(line);
    }
};
// Clear Single Line Widget
const clearLineWidgets = (line) => {
    if (line.widgets) {
        for (const wid of line.widgets) {
            if (wid.className === 'oz-image-widget') {
                wid.clear();
            }
        }
    }
};
// Check line if it is a link
const get_link_in_line = (line) => {
    const image_http_regex_3 = /!\[\[[a-z][a-z0-9+\-.]+:\/.*\]\]/;
    const image_http_regex_4 = /!\[(^$|.*)\]\([a-z][a-z0-9+\-.]+:\/.*\)/;
    const match_3 = line.match(image_http_regex_3);
    const match_4 = line.match(image_http_regex_4);
    if (match_3) {
        return { result: match_3, linkType: 3 };
    }
    else if (match_4) {
        return { result: match_4, linkType: 4 };
    }
    return { result: false, linkType: 0 };
};
// Check line if it is image
const get_image_in_line = (line) => {
    // Regex for [[ ]] format
    const image_line_regex_1 = /!\[\[.*(jpe?g|png|gif|svg|bmp).*\]\]/;
    // Regex for ![ ]( ) format
    const image_line_regex_2 = /!\[(^$|.*)\]\(.*(jpe?g|png|gif|svg|bmp)\)/;
    const match_1 = line.match(image_line_regex_1);
    const match_2 = line.match(image_line_regex_2);
    if (match_1) {
        return { result: match_1, linkType: 1 };
    }
    else if (match_2) {
        return { result: match_2, linkType: 2 };
    }
    return { result: false, linkType: 0 };
};
// Image Name and Alt Text
const getFileNameAndAltText = (linkType, match) => {
    /*
       linkType 1: ![[myimage.jpg|#x-small]], linkType 2: ![#x-small](myimage.jpg)
       linkType 3: ![[https://image|#x-small]], linkType 4: ![#x-small](https://image)
       returns { fileName: '', altText: '' }
    */
    var file_name_regex;
    var alt_regex;
    if (linkType == 1 || linkType == 3) {
        if (linkType == 1)
            file_name_regex = /(?<=\[\[).*(jpe?g|png|gif|svg|bmp)/;
        if (linkType == 3)
            file_name_regex = /(?<=\[\[).*(?=\|)|(?<=\[\[).*(?=\]\])/;
        alt_regex = /(?<=\|).*(?=]])/;
    }
    else if (linkType == 2 || linkType == 4) {
        if (linkType == 2)
            file_name_regex = /(?<=\().*(jpe?g|png|gif|svg|bmp)/;
        if (linkType == 4)
            file_name_regex = /(?<=\().*(?=\))/;
        alt_regex = /(?<=\[)(^$|.*)(?=\])/;
    }
    var file_match = match[0].match(file_name_regex);
    var alt_match = match[0].match(alt_regex);
    return {
        fileName: file_match ? file_match[0] : '',
        altText: alt_match ? alt_match[0] : ''
    };
};
// Getting Active Markdown File
const getActiveNoteFile = (workspace) => {
    return workspace.getActiveFile();
};
// Get Full Path of the image
const getPathOfImage = (vault, image) => {
    return vault.getResourcePath(image) + '?' + image.stat.mtime;
};
const getFileCmBelongsTo = (cm, workspace) => {
    var _a;
    let leafs = workspace.getLeavesOfType("markdown");
    for (let i = 0; i < leafs.length; i++) {
        if (leafs[i].view instanceof obsidian.MarkdownView && ((_a = leafs[i].view.sourceMode) === null || _a === void 0 ? void 0 : _a.cmEditor) == cm) {
            return leafs[i].view.file;
        }
    }
    return null;
};

// Check Single Line
const check_line = (cm, line_number, targetFile, app) => {
    // Get the Line edited
    const line = cm.lineInfo(line_number);
    if (line === null)
        return;
    // Check if the line is an internet link
    const link_in_line = get_link_in_line(line.text);
    const img_in_line = get_image_in_line(line.text);
    // Clear the widget if link was removed
    var line_image_widget = line.widgets ? line.widgets.filter((wid) => wid.className === 'oz-image-widget') : false;
    if (line_image_widget && !(img_in_line.result || link_in_line.result))
        line_image_widget[0].clear();
    // If any of regex matches, it will add image widget
    if (link_in_line.result || img_in_line.result) {
        // Clear the image widgets if exists
        clearLineWidgets(line);
        // Get the file name and alt text depending on format
        var filename = '';
        var alt = '';
        if (link_in_line.result) {
            // linkType 3 and 4
            filename = getFileNameAndAltText(link_in_line.linkType, link_in_line.result).fileName;
            alt = getFileNameAndAltText(link_in_line.linkType, link_in_line.result).altText;
        }
        else if (img_in_line.result) {
            filename = getFileNameAndAltText(img_in_line.linkType, img_in_line.result).fileName;
            alt = getFileNameAndAltText(img_in_line.linkType, img_in_line.result).altText;
        }
        // Create Image
        const img = document.createElement('img');
        // Prepare the src for the Image
        if (link_in_line.result) {
            img.src = filename;
        }
        else {
            // Source Path
            var sourcePath = '';
            if (targetFile != null) {
                sourcePath = targetFile.path;
            }
            else {
                let activeNoteFile = getActiveNoteFile(app.workspace);
                sourcePath = activeNoteFile ? activeNoteFile.path : '';
            }
            var image = app.metadataCache.getFirstLinkpathDest(decodeURIComponent(filename), sourcePath);
            if (image != null)
                img.src = getPathOfImage(app.vault, image);
        }
        // Image Properties
        img.alt = alt;
        // Add Image widget under the Image Markdown
        cm.addLineWidget(line_number, img, { className: 'oz-image-widget' });
    }
};
// Check All Lines Function
const check_lines = (cm, from, to, app) => {
    // Last Used Line Number in Code Mirror
    var file = getFileCmBelongsTo(cm, app.workspace);
    for (let i = from; i <= to; i++) {
        check_line(cm, i, file, app);
    }
};

class OzanImagePlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        // Line Edit Changes
        this.codemirrorLineChanges = (cm, change) => {
            check_lines(cm, change.from.line, change.from.line + change.text.length - 1, this.app);
        };
        // Only Triggered during initial Load
        this.handleInitialLoad = (cm) => {
            var lastLine = cm.lastLine();
            var file = getFileCmBelongsTo(cm, this.app.workspace);
            for (let i = 0; i < lastLine; i++) {
                check_line(cm, i, file, this.app);
            }
        };
    }
    onload() {
        console.log('Image in Editor Plugin is loaded');
        // Register event for each change
        this.registerCodeMirror((cm) => {
            cm.on("change", this.codemirrorLineChanges);
            this.handleInitialLoad(cm);
        });
    }
    onunload() {
        this.app.workspace.iterateCodeMirrors((cm) => {
            cm.off("change", this.codemirrorLineChanges);
            clearWidgets(cm);
        });
        console.log('Image in Editor Plugin is unloaded');
    }
}

module.exports = OzanImagePlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsic3JjL3V0aWxzLnRzIiwic3JjL2NoZWNrLWxpbmUudHMiLCJzcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXb3Jrc3BhY2UsIE1hcmtkb3duVmlldywgVmF1bHQsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuXG4vLyBSZW1vdmUgV2lkZ2V0cyBpbiBDb2RlTWlycm9yIEVkaXRvclxuZXhwb3J0IGNvbnN0IGNsZWFyV2lkZ2V0cyA9IChjbTogQ29kZU1pcnJvci5FZGl0b3IpID0+IHtcbiAgICB2YXIgbGFzdExpbmUgPSBjbS5sYXN0TGluZSgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGxhc3RMaW5lOyBpKyspIHtcbiAgICAgICAgY29uc3QgbGluZSA9IGNtLmxpbmVJbmZvKGkpO1xuICAgICAgICBjbGVhckxpbmVXaWRnZXRzKGxpbmUpO1xuICAgIH1cbn1cblxuLy8gQ2xlYXIgU2luZ2xlIExpbmUgV2lkZ2V0XG5leHBvcnQgY29uc3QgY2xlYXJMaW5lV2lkZ2V0cyA9IChsaW5lOiBhbnkpID0+IHtcbiAgICBpZiAobGluZS53aWRnZXRzKSB7XG4gICAgICAgIGZvciAoY29uc3Qgd2lkIG9mIGxpbmUud2lkZ2V0cykge1xuICAgICAgICAgICAgaWYgKHdpZC5jbGFzc05hbWUgPT09ICdvei1pbWFnZS13aWRnZXQnKSB7XG4gICAgICAgICAgICAgICAgd2lkLmNsZWFyKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQ2hlY2sgbGluZSBpZiBpdCBpcyBhIGxpbmtcbmV4cG9ydCBjb25zdCBnZXRfbGlua19pbl9saW5lID0gKGxpbmU6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGltYWdlX2h0dHBfcmVnZXhfMyA9IC8hXFxbXFxbW2Etel1bYS16MC05K1xcLS5dKzpcXC8uKlxcXVxcXS9cbiAgICBjb25zdCBpbWFnZV9odHRwX3JlZ2V4XzQgPSAvIVxcWyheJHwuKilcXF1cXChbYS16XVthLXowLTkrXFwtLl0rOlxcLy4qXFwpL1xuICAgIGNvbnN0IG1hdGNoXzMgPSBsaW5lLm1hdGNoKGltYWdlX2h0dHBfcmVnZXhfMyk7XG4gICAgY29uc3QgbWF0Y2hfNCA9IGxpbmUubWF0Y2goaW1hZ2VfaHR0cF9yZWdleF80KTtcbiAgICBpZiAobWF0Y2hfMykge1xuICAgICAgICByZXR1cm4geyByZXN1bHQ6IG1hdGNoXzMsIGxpbmtUeXBlOiAzIH07XG4gICAgfSBlbHNlIGlmIChtYXRjaF80KSB7XG4gICAgICAgIHJldHVybiB7IHJlc3VsdDogbWF0Y2hfNCwgbGlua1R5cGU6IDQgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgcmVzdWx0OiBmYWxzZSwgbGlua1R5cGU6IDAgfTtcbn1cblxuLy8gQ2hlY2sgbGluZSBpZiBpdCBpcyBpbWFnZVxuZXhwb3J0IGNvbnN0IGdldF9pbWFnZV9pbl9saW5lID0gKGxpbmU6IHN0cmluZykgPT4ge1xuICAgIC8vIFJlZ2V4IGZvciBbWyBdXSBmb3JtYXRcbiAgICBjb25zdCBpbWFnZV9saW5lX3JlZ2V4XzEgPSAvIVxcW1xcWy4qKGpwZT9nfHBuZ3xnaWZ8c3ZnfGJtcCkuKlxcXVxcXS9cbiAgICAvLyBSZWdleCBmb3IgIVsgXSggKSBmb3JtYXRcbiAgICBjb25zdCBpbWFnZV9saW5lX3JlZ2V4XzIgPSAvIVxcWyheJHwuKilcXF1cXCguKihqcGU/Z3xwbmd8Z2lmfHN2Z3xibXApXFwpL1xuICAgIGNvbnN0IG1hdGNoXzEgPSBsaW5lLm1hdGNoKGltYWdlX2xpbmVfcmVnZXhfMSk7XG4gICAgY29uc3QgbWF0Y2hfMiA9IGxpbmUubWF0Y2goaW1hZ2VfbGluZV9yZWdleF8yKTtcbiAgICBpZiAobWF0Y2hfMSkge1xuICAgICAgICByZXR1cm4geyByZXN1bHQ6IG1hdGNoXzEsIGxpbmtUeXBlOiAxIH1cbiAgICB9IGVsc2UgaWYgKG1hdGNoXzIpIHtcbiAgICAgICAgcmV0dXJuIHsgcmVzdWx0OiBtYXRjaF8yLCBsaW5rVHlwZTogMiB9XG4gICAgfVxuICAgIHJldHVybiB7IHJlc3VsdDogZmFsc2UsIGxpbmtUeXBlOiAwIH1cbn1cblxuLy8gSW1hZ2UgTmFtZSBhbmQgQWx0IFRleHRcbmV4cG9ydCBjb25zdCBnZXRGaWxlTmFtZUFuZEFsdFRleHQgPSAobGlua1R5cGU6IG51bWJlciwgbWF0Y2g6IGFueSkgPT4ge1xuICAgIC8qIFxuICAgICAgIGxpbmtUeXBlIDE6ICFbW215aW1hZ2UuanBnfCN4LXNtYWxsXV0sIGxpbmtUeXBlIDI6ICFbI3gtc21hbGxdKG15aW1hZ2UuanBnKSBcbiAgICAgICBsaW5rVHlwZSAzOiAhW1todHRwczovL2ltYWdlfCN4LXNtYWxsXV0sIGxpbmtUeXBlIDQ6ICFbI3gtc21hbGxdKGh0dHBzOi8vaW1hZ2UpIFxuICAgICAgIHJldHVybnMgeyBmaWxlTmFtZTogJycsIGFsdFRleHQ6ICcnIH0gICBcbiAgICAqL1xuICAgIHZhciBmaWxlX25hbWVfcmVnZXg7XG4gICAgdmFyIGFsdF9yZWdleDtcblxuICAgIGlmIChsaW5rVHlwZSA9PSAxIHx8IGxpbmtUeXBlID09IDMpIHtcbiAgICAgICAgaWYgKGxpbmtUeXBlID09IDEpIGZpbGVfbmFtZV9yZWdleCA9IC8oPzw9XFxbXFxbKS4qKGpwZT9nfHBuZ3xnaWZ8c3ZnfGJtcCkvO1xuICAgICAgICBpZiAobGlua1R5cGUgPT0gMykgZmlsZV9uYW1lX3JlZ2V4ID0gLyg/PD1cXFtcXFspLiooPz1cXHwpfCg/PD1cXFtcXFspLiooPz1cXF1cXF0pLztcbiAgICAgICAgYWx0X3JlZ2V4ID0gLyg/PD1cXHwpLiooPz1dXSkvO1xuICAgIH0gZWxzZSBpZiAobGlua1R5cGUgPT0gMiB8fCBsaW5rVHlwZSA9PSA0KSB7XG4gICAgICAgIGlmIChsaW5rVHlwZSA9PSAyKSBmaWxlX25hbWVfcmVnZXggPSAvKD88PVxcKCkuKihqcGU/Z3xwbmd8Z2lmfHN2Z3xibXApLztcbiAgICAgICAgaWYgKGxpbmtUeXBlID09IDQpIGZpbGVfbmFtZV9yZWdleCA9IC8oPzw9XFwoKS4qKD89XFwpKS87XG4gICAgICAgIGFsdF9yZWdleCA9IC8oPzw9XFxbKSheJHwuKikoPz1cXF0pLztcbiAgICB9XG5cbiAgICB2YXIgZmlsZV9tYXRjaCA9IG1hdGNoWzBdLm1hdGNoKGZpbGVfbmFtZV9yZWdleCk7XG4gICAgdmFyIGFsdF9tYXRjaCA9IG1hdGNoWzBdLm1hdGNoKGFsdF9yZWdleCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaWxlTmFtZTogZmlsZV9tYXRjaCA/IGZpbGVfbWF0Y2hbMF0gOiAnJyxcbiAgICAgICAgYWx0VGV4dDogYWx0X21hdGNoID8gYWx0X21hdGNoWzBdIDogJydcbiAgICB9XG59XG5cbi8vIEdldHRpbmcgQWN0aXZlIE1hcmtkb3duIEZpbGVcbmV4cG9ydCBjb25zdCBnZXRBY3RpdmVOb3RlRmlsZSA9ICh3b3Jrc3BhY2U6IFdvcmtzcGFjZSkgPT4ge1xuICAgIHJldHVybiB3b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xufVxuXG4vLyBHZXQgQWN0aXZlIEVkaXRvclxuZXhwb3J0IGNvbnN0IGdldENtRWRpdG9yID0gKHdvcmtzcGFjZTogV29ya3NwYWNlKTogQ29kZU1pcnJvci5FZGl0b3IgPT4ge1xuICAgIHJldHVybiB3b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpPy5zb3VyY2VNb2RlPy5jbUVkaXRvclxufVxuXG4vLyBHZXQgRnVsbCBQYXRoIG9mIHRoZSBpbWFnZVxuZXhwb3J0IGNvbnN0IGdldFBhdGhPZkltYWdlID0gKHZhdWx0OiBWYXVsdCwgaW1hZ2U6IFRGaWxlKSA9PiB7XG4gICAgcmV0dXJuIHZhdWx0LmdldFJlc291cmNlUGF0aChpbWFnZSkgKyAnPycgKyBpbWFnZS5zdGF0Lm10aW1lXG59XG5cbmV4cG9ydCBjb25zdCBnZXRGaWxlQ21CZWxvbmdzVG8gPSAoY206IENvZGVNaXJyb3IuRWRpdG9yLCB3b3Jrc3BhY2U6IFdvcmtzcGFjZSkgPT4ge1xuICAgIGxldCBsZWFmcyA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoXCJtYXJrZG93blwiKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlYWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChsZWFmc1tpXS52aWV3IGluc3RhbmNlb2YgTWFya2Rvd25WaWV3ICYmIGxlYWZzW2ldLnZpZXcuc291cmNlTW9kZT8uY21FZGl0b3IgPT0gY20pIHtcbiAgICAgICAgICAgIHJldHVybiBsZWFmc1tpXS52aWV3LmZpbGVcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn0iLCJpbXBvcnQgeyBBcHAsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgZ2V0RmlsZU5hbWVBbmRBbHRUZXh0LCBnZXRfbGlua19pbl9saW5lLCBnZXRfaW1hZ2VfaW5fbGluZSxcbiAgICAgICAgZ2V0QWN0aXZlTm90ZUZpbGUsIGdldFBhdGhPZkltYWdlLCBnZXRGaWxlQ21CZWxvbmdzVG8sXG4gICAgICAgIGNsZWFyTGluZVdpZGdldHMgfSBmcm9tICcuL3V0aWxzJztcblxuLy8gQ2hlY2sgU2luZ2xlIExpbmVcbmV4cG9ydCBjb25zdCBjaGVja19saW5lOiBhbnkgPSAoY206IENvZGVNaXJyb3IuRWRpdG9yLCBsaW5lX251bWJlcjogbnVtYmVyLCB0YXJnZXRGaWxlOlRGaWxlLCBhcHA6IEFwcCkgPT4ge1xuXG4gICAgLy8gR2V0IHRoZSBMaW5lIGVkaXRlZFxuICAgIGNvbnN0IGxpbmUgPSBjbS5saW5lSW5mbyhsaW5lX251bWJlcik7XG4gICAgaWYobGluZSA9PT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGxpbmUgaXMgYW4gaW50ZXJuZXQgbGlua1xuICAgIGNvbnN0IGxpbmtfaW5fbGluZSA9IGdldF9saW5rX2luX2xpbmUobGluZS50ZXh0KTtcbiAgICBjb25zdCBpbWdfaW5fbGluZSA9IGdldF9pbWFnZV9pbl9saW5lKGxpbmUudGV4dCk7XG5cbiAgICAvLyBDbGVhciB0aGUgd2lkZ2V0IGlmIGxpbmsgd2FzIHJlbW92ZWRcbiAgICB2YXIgbGluZV9pbWFnZV93aWRnZXQgPSBsaW5lLndpZGdldHMgPyBsaW5lLndpZGdldHMuZmlsdGVyKCh3aWQ6IHsgY2xhc3NOYW1lOiBzdHJpbmc7IH0pID0+IHdpZC5jbGFzc05hbWUgPT09ICdvei1pbWFnZS13aWRnZXQnKSA6IGZhbHNlO1xuICAgIGlmKGxpbmVfaW1hZ2Vfd2lkZ2V0ICYmICEoaW1nX2luX2xpbmUucmVzdWx0IHx8IGxpbmtfaW5fbGluZS5yZXN1bHQpKSBsaW5lX2ltYWdlX3dpZGdldFswXS5jbGVhcigpO1xuXG4gICAgLy8gSWYgYW55IG9mIHJlZ2V4IG1hdGNoZXMsIGl0IHdpbGwgYWRkIGltYWdlIHdpZGdldFxuICAgIGlmKGxpbmtfaW5fbGluZS5yZXN1bHQgfHwgaW1nX2luX2xpbmUucmVzdWx0KXtcbiAgICAgICAgICAgIFxuICAgICAgICAvLyBDbGVhciB0aGUgaW1hZ2Ugd2lkZ2V0cyBpZiBleGlzdHNcbiAgICAgICAgY2xlYXJMaW5lV2lkZ2V0cyhsaW5lKTtcblxuICAgICAgICAvLyBHZXQgdGhlIGZpbGUgbmFtZSBhbmQgYWx0IHRleHQgZGVwZW5kaW5nIG9uIGZvcm1hdFxuICAgICAgICB2YXIgZmlsZW5hbWUgPSAnJztcbiAgICAgICAgdmFyIGFsdCA9ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYobGlua19pbl9saW5lLnJlc3VsdCl7XG4gICAgICAgICAgICAvLyBsaW5rVHlwZSAzIGFuZCA0XG4gICAgICAgICAgICBmaWxlbmFtZSA9IGdldEZpbGVOYW1lQW5kQWx0VGV4dChsaW5rX2luX2xpbmUubGlua1R5cGUsIGxpbmtfaW5fbGluZS5yZXN1bHQpLmZpbGVOYW1lXG4gICAgICAgICAgICBhbHQgPSBnZXRGaWxlTmFtZUFuZEFsdFRleHQobGlua19pbl9saW5lLmxpbmtUeXBlLCBsaW5rX2luX2xpbmUucmVzdWx0KS5hbHRUZXh0XG4gICAgICAgIH0gZWxzZSBpZihpbWdfaW5fbGluZS5yZXN1bHQpe1xuICAgICAgICAgICAgZmlsZW5hbWUgPSBnZXRGaWxlTmFtZUFuZEFsdFRleHQoaW1nX2luX2xpbmUubGlua1R5cGUsIGltZ19pbl9saW5lLnJlc3VsdCkuZmlsZU5hbWU7XG4gICAgICAgICAgICBhbHQgPSBnZXRGaWxlTmFtZUFuZEFsdFRleHQoaW1nX2luX2xpbmUubGlua1R5cGUsIGltZ19pbl9saW5lLnJlc3VsdCkuYWx0VGV4dFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBDcmVhdGUgSW1hZ2VcbiAgICAgICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cbiAgICAgICAgLy8gUHJlcGFyZSB0aGUgc3JjIGZvciB0aGUgSW1hZ2VcbiAgICAgICAgaWYobGlua19pbl9saW5lLnJlc3VsdCl7XG4gICAgICAgICAgICBpbWcuc3JjID0gZmlsZW5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTb3VyY2UgUGF0aFxuICAgICAgICAgICAgdmFyIHNvdXJjZVBhdGggPSAnJztcbiAgICAgICAgICAgIGlmKHRhcmdldEZpbGUgIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgc291cmNlUGF0aCA9IHRhcmdldEZpbGUucGF0aDtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGxldCBhY3RpdmVOb3RlRmlsZSA9IGdldEFjdGl2ZU5vdGVGaWxlKGFwcC53b3Jrc3BhY2UpO1xuICAgICAgICAgICAgICAgIHNvdXJjZVBhdGggPSBhY3RpdmVOb3RlRmlsZSA/IGFjdGl2ZU5vdGVGaWxlLnBhdGggOiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBpbWFnZSA9IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KGRlY29kZVVSSUNvbXBvbmVudChmaWxlbmFtZSksIHNvdXJjZVBhdGgpO1xuICAgICAgICAgICAgaWYoaW1hZ2UgIT0gbnVsbCkgaW1nLnNyYyA9IGdldFBhdGhPZkltYWdlKGFwcC52YXVsdCwgaW1hZ2UpXG4gICAgICAgIH1cbiAgICAgICAgLy8gSW1hZ2UgUHJvcGVydGllc1xuICAgICAgICBpbWcuYWx0ID0gYWx0O1xuICAgICAgICBcbiAgICAgICAgLy8gQWRkIEltYWdlIHdpZGdldCB1bmRlciB0aGUgSW1hZ2UgTWFya2Rvd25cbiAgICAgICAgY20uYWRkTGluZVdpZGdldChsaW5lX251bWJlciwgaW1nLCB7Y2xhc3NOYW1lOiAnb3otaW1hZ2Utd2lkZ2V0J30pOyAgICAgICAgICAgIFxuICAgIH1cbn1cblxuLy8gQ2hlY2sgQWxsIExpbmVzIEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgY2hlY2tfbGluZXM6IGFueSA9IChjbTogQ29kZU1pcnJvci5FZGl0b3IsIGZyb206IG51bWJlciwgdG86IG51bWJlciwgYXBwOiBBcHApID0+IHtcbiAgICAvLyBMYXN0IFVzZWQgTGluZSBOdW1iZXIgaW4gQ29kZSBNaXJyb3JcbiAgICB2YXIgZmlsZSA9IGdldEZpbGVDbUJlbG9uZ3NUbyhjbSwgYXBwLndvcmtzcGFjZSk7XG4gICAgZm9yKGxldCBpPWZyb207IGkgPD0gdG87IGkrKyl7XG4gICAgICAgIGNoZWNrX2xpbmUoY20sIGksIGZpbGUsIGFwcCk7XG4gICAgfVxufSIsImltcG9ydCB7IFBsdWdpbiB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IGNsZWFyV2lkZ2V0cywgZ2V0RmlsZUNtQmVsb25nc1RvIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBjaGVja19saW5lLCBjaGVja19saW5lcyB9IGZyb20gJy4vY2hlY2stbGluZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE96YW5JbWFnZVBsdWdpbiBleHRlbmRzIFBsdWdpbntcblxuICAgIG9ubG9hZCgpe1xuICAgICAgICBjb25zb2xlLmxvZygnSW1hZ2UgaW4gRWRpdG9yIFBsdWdpbiBpcyBsb2FkZWQnKTtcbiAgICAgICAgLy8gUmVnaXN0ZXIgZXZlbnQgZm9yIGVhY2ggY2hhbmdlXG4gICAgICAgIHRoaXMucmVnaXN0ZXJDb2RlTWlycm9yKCAoY206IENvZGVNaXJyb3IuRWRpdG9yKSA9PiB7XG4gICAgICAgICAgICBjbS5vbihcImNoYW5nZVwiLCB0aGlzLmNvZGVtaXJyb3JMaW5lQ2hhbmdlcyk7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUluaXRpYWxMb2FkKGNtKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBvbnVubG9hZCgpe1xuICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuaXRlcmF0ZUNvZGVNaXJyb3JzKCAoY20pID0+IHtcbiAgICAgICAgICAgIGNtLm9mZihcImNoYW5nZVwiLCB0aGlzLmNvZGVtaXJyb3JMaW5lQ2hhbmdlcyk7XG4gICAgICAgICAgICBjbGVhcldpZGdldHMoY20pO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ltYWdlIGluIEVkaXRvciBQbHVnaW4gaXMgdW5sb2FkZWQnKTtcbiAgICB9XG5cbiAgICAvLyBMaW5lIEVkaXQgQ2hhbmdlc1xuICAgIGNvZGVtaXJyb3JMaW5lQ2hhbmdlcyA9IChjbTogYW55LCBjaGFuZ2U6IGFueSkgPT4ge1xuICAgICAgICBjaGVja19saW5lcyhjbSwgY2hhbmdlLmZyb20ubGluZSwgY2hhbmdlLmZyb20ubGluZSArIGNoYW5nZS50ZXh0Lmxlbmd0aCAtIDEsIHRoaXMuYXBwKTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IFRyaWdnZXJlZCBkdXJpbmcgaW5pdGlhbCBMb2FkXG4gICAgaGFuZGxlSW5pdGlhbExvYWQgPSAoY206IENvZGVNaXJyb3IuRWRpdG9yKSA9PiB7XG4gICAgICAgIHZhciBsYXN0TGluZSA9IGNtLmxhc3RMaW5lKCk7XG4gICAgICAgIHZhciBmaWxlID0gZ2V0RmlsZUNtQmVsb25nc1RvKGNtLCB0aGlzLmFwcC53b3Jrc3BhY2UpO1xuICAgICAgICBmb3IobGV0IGk9MDsgaSA8IGxhc3RMaW5lOyBpKyspe1xuICAgICAgICAgICAgY2hlY2tfbGluZShjbSwgaSwgZmlsZSwgdGhpcy5hcHApO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxufSJdLCJuYW1lcyI6WyJNYXJrZG93blZpZXciLCJQbHVnaW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUVBO0FBQ08sTUFBTSxZQUFZLEdBQUcsQ0FBQyxFQUFxQjtJQUM5QyxJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNoQyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzFCO0FBQ0wsQ0FBQyxDQUFBO0FBRUQ7QUFDTyxNQUFNLGdCQUFnQixHQUFHLENBQUMsSUFBUztJQUN0QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDZCxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDNUIsSUFBSSxHQUFHLENBQUMsU0FBUyxLQUFLLGlCQUFpQixFQUFFO2dCQUNyQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUE7YUFDZDtTQUNKO0tBQ0o7QUFDTCxDQUFDLENBQUE7QUFFRDtBQUNPLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxJQUFZO0lBQ3pDLE1BQU0sa0JBQWtCLEdBQUcsa0NBQWtDLENBQUE7SUFDN0QsTUFBTSxrQkFBa0IsR0FBRyx5Q0FBeUMsQ0FBQTtJQUNwRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDL0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQy9DLElBQUksT0FBTyxFQUFFO1FBQ1QsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDO0tBQzNDO1NBQU0sSUFBSSxPQUFPLEVBQUU7UUFD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
