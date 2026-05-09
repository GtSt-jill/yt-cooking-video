import { Trash2 } from "lucide-react";
import { formatTime } from "../lib/time";
import type { Bookmark } from "../types/bookmark";

type BookmarkListProps = {
  bookmarks: Bookmark[];
  onSelect: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
};

export function BookmarkList({ bookmarks, onSelect, onDelete }: BookmarkListProps) {
  return (
    <section className="panel bookmark-panel" aria-label="ブックマーク">
      <div className="panel-heading">
        <h2>ブックマーク</h2>
        <span className="count-pill">{bookmarks.length}</span>
      </div>
      {bookmarks.length === 0 ? (
        <p className="muted-text">保存した手順はまだありません。</p>
      ) : (
        <ol className="bookmark-list">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id}>
              <button type="button" className="bookmark-main" onClick={() => onSelect(bookmark)}>
                <span className="bookmark-time">{formatTime(bookmark.time)}</span>
                <span>{bookmark.label}</span>
              </button>
              <button type="button" className="icon-button" aria-label={`${bookmark.label} を削除`} onClick={() => onDelete(bookmark.id)}>
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
