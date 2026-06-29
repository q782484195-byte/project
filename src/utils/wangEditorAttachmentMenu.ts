import { Boot, type IDomEditor, type IButtonMenu } from "@wangeditor-next/editor";
import { insertAttachmentNode, uploadAttachmentToServer } from "@/utils/excelPaste";

export const UPLOAD_ATTACHMENT_MENU_KEY = "uploadAttachment";

/** 与 WangEditor 内置图标风格一致的上传箭头图标 */
const ATTACHMENT_ICON_SVG = `<svg viewBox="0 0 1024 1024"><path d="M522 128l226.3 226.3-45.2 45.2L562 237.2V768h-100V237.2L340.9 399.5l-45.2-45.2L522 128zM128 832h768v96H128V832z" fill="currentColor"></path></svg>`;

class UploadAttachmentMenu implements IButtonMenu {
  readonly title = "上传附件";
  readonly tag = "button";
  readonly iconSvg = ATTACHMENT_ICON_SVG;

  getValue(_editor: IDomEditor): string | boolean {
    return "";
  }

  isActive(_editor: IDomEditor): boolean {
    return false;
  }

  isDisabled(_editor: IDomEditor): boolean {
    return false;
  }

  exec(editor: IDomEditor) {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    document.body.appendChild(input);

    input.onchange = async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;

      const uploaded = await uploadAttachmentToServer(file);
      if (!uploaded) return;

      editor.restoreSelection();
      insertAttachmentNode(
        editor,
        uploaded.href,
        uploaded.name,
        uploaded.relativePath
      );
    };

    input.click();
  }
}

let registered = false;

export function registerUploadAttachmentMenu() {
  if (registered) return;
  Boot.registerMenu({
    key: UPLOAD_ATTACHMENT_MENU_KEY,
    factory() {
      return new UploadAttachmentMenu();
    }
  });
  registered = true;
}
