import { API_BASE_URL } from "@/config/api";
import { formatToken, getToken } from "@/utils/auth";

export function resolveFileUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export function previewAttachment(path: string) {
  const url = resolveFileUrl(path);
  if (!url) {
    uni.showToast({ title: "附件地址无效", icon: "none" });
    return;
  }

  uni.showLoading({ title: "加载中", mask: true });
  const token = getToken();
  uni.downloadFile({
    url,
    header: token ? { Authorization: formatToken(token) } : {},
    success(res) {
      if (res.statusCode !== 200) {
        uni.showToast({ title: "下载失败", icon: "none" });
        return;
      }
      uni.openDocument({
        filePath: res.tempFilePath,
        showMenu: true,
        fail() {
          uni.showToast({ title: "无法打开此文件", icon: "none" });
        }
      });
    },
    fail() {
      uni.showToast({ title: "下载附件失败", icon: "none" });
    },
    complete() {
      uni.hideLoading();
    }
  });
}
