"use client";

import { useId } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { MIN_GROUP_MEMBERS, useStudioStore } from "../../store";
import type { GroupChat, Person } from "../../types";
import { MEDIA_AVATARS } from "../../data/media-library";
import type { StudioLabels } from "../labels";
import { AvatarField } from "./ParticipantCard";
import { fmt } from "./timing";

const PEOPLE = MEDIA_AVATARS.filter((a) => a.id !== "av-bag" && a.id !== "av-spark");

/** A fresh member with an unused default name and a built-in avatar. */
export function nextMember(taken: Person[], t: StudioLabels): Person {
  const names = t.defaultMembers.split("|");
  const used = new Set(taken.map((p) => p.name.trim()));
  const name = names.find((n) => !used.has(n)) ?? `${names[0]} ${taken.length + 1}`;
  const avatars = new Set(taken.map((p) => p.avatar));
  const avatar = (PEOPLE.find((a) => !avatars.has(a.src)) ?? PEOPLE[taken.length % PEOPLE.length]).src;
  return { name, avatar };
}

/** Default group picture placeholder inside the editor (apps draw their own). */
function GroupGlyph() {
  return (
    <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-inset ring-border">
      <Users className="size-5" />
    </span>
  );
}

/** Group name + photo and the ordered member list (min. two other members). */
export function GroupEditor({ group, me, t }: { group: GroupChat; me: Person; t: StudioLabels }) {
  const updateGroup = useStudioStore((s) => s.updateGroup);
  const addMember = useStudioStore((s) => s.addMember);
  const updateMember = useStudioStore((s) => s.updateMember);
  const removeMember = useStudioStore((s) => s.removeMember);
  const moveMember = useStudioStore((s) => s.moveMember);
  const nameId = useId();
  const listId = useId();
  const atMin = group.members.length <= MIN_GROUP_MEMBERS;

  const focusRow = (index: number) =>
    requestAnimationFrame(() =>
      document.querySelector<HTMLInputElement>(`[data-member-input="${listId}-${index}"]`)?.focus({ preventScroll: false }),
    );

  return (
    <div className="space-y-2">
      <div className="relative flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 shadow-studio-card">
        <span aria-hidden className="absolute inset-y-3 start-0 w-[3px] rounded-e-full bg-studio-them" />
        <AvatarField
          person={{ name: group.name, avatar: group.avatar }}
          t={t}
          label={t.groupPhoto}
          onChange={(avatar) => updateGroup({ avatar })}
          fallback={<GroupGlyph />}
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={nameId} className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-studio-them" />
            {t.groupName}
          </label>
          <Input
            id={nameId}
            value={group.name}
            onChange={(e) => updateGroup({ name: e.target.value })}
            placeholder={t.groupDefaultName}
            dir="auto"
            className="h-8 text-[13px] font-medium"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-studio-card">
        <div className="flex items-center gap-2 border-b border-border/70 py-1.5 ps-3 pe-1.5">
          <p id={listId} className="text-xs font-semibold">
            {t.members}
          </p>
          <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
            {fmt(t.membersCount, { count: group.members.length + 1 })}
          </span>
          <Button
            variant="soft"
            size="xs"
            className="ms-auto"
            onClick={() => {
              addMember(nextMember([me, ...group.members], t));
              focusRow(group.members.length);
            }}
          >
            <Plus className="size-3.5" />
            {t.addMember}
          </Button>
        </div>
        <ol aria-labelledby={listId} className="divide-y divide-border/60">
          {group.members.map((p, i) => (
            <li key={i} className="flex items-center gap-2 py-1.5 ps-2.5 pe-1.5">
              <span className="w-3 text-center text-[11px] tabular-nums text-muted-foreground" aria-hidden>
                {i + 1}
              </span>
              <AvatarField
                person={p}
                size={30}
                t={t}
                label={`${p.avatar ? t.changePhoto : t.mediaChoose} — ${p.name || fmt(t.memberName, { n: i + 1 })}`}
                onChange={(avatar) => updateMember(i, { avatar })}
              />
              <Input
                aria-label={fmt(t.memberName, { n: i + 1 })}
                data-member-input={`${listId}-${i}`}
                value={p.name}
                onChange={(e) => updateMember(i, { name: e.target.value })}
                placeholder={t.name}
                dir="auto"
                className="h-7 min-w-0 flex-1 text-[13px]"
              />
              <div className="flex shrink-0 items-center">
                <Tooltip content={t.moveUp}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${t.moveUp} — ${p.name || i + 1}`}
                    disabled={i === 0}
                    onClick={() => {
                      moveMember(i, -1);
                      focusRow(i - 1);
                    }}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip content={t.moveDown}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${t.moveDown} — ${p.name || i + 1}`}
                    disabled={i === group.members.length - 1}
                    onClick={() => {
                      moveMember(i, 1);
                      focusRow(i + 1);
                    }}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip content={atMin ? t.memberMinHint : t.removeMember}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${t.removeMember} — ${p.name || i + 1}`}
                    aria-disabled={atMin || undefined}
                    onClick={() => {
                      if (atMin) return;
                      removeMember(i);
                      focusRow(Math.max(0, i - 1));
                    }}
                    className={atMin ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "hover:bg-destructive/10 hover:text-destructive"}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ol>
        {atMin && <p className="border-t border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">{t.memberMinHint}</p>}
      </div>
    </div>
  );
}
