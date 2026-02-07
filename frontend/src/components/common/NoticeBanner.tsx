import type { Notice } from "../../helpers";

type Props = {
  notice: Notice | null;
};

export function NoticeBanner({ notice }: Props) {
  if (!notice) {
    return null;
  }

  return <div className={`notice notice--${notice.kind}`}>{notice.message}</div>;
}
