"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const IdeaCategoriesContext = createContext<string[]>([]);

/** Shares the collection's categories with every idea dialog on the page. */
export function IdeaCategoriesProvider({
  categories,
  children,
}: {
  categories: string[];
  children: ReactNode;
}) {
  return (
    <IdeaCategoriesContext.Provider value={categories}>{children}</IdeaCategoriesContext.Provider>
  );
}

type CategoryComboboxProps = Omit<
  ComponentProps<typeof Input>,
  "defaultValue" | "value" | "onChange"
> & {
  defaultValue?: string;
};

/** Free-text input that suggests the categories already used in the collection. */
export function CategoryCombobox({ defaultValue = "", ...props }: CategoryComboboxProps) {
  const categories = useContext(IdeaCategoriesContext);
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  // Stays false until the user types, so a prefilled value doesn't hide the other categories.
  const [filtering, setFiltering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = value.trim().toLocaleLowerCase();
  const suggestions =
    filtering && query
      ? categories.filter((category) => category.toLocaleLowerCase().includes(query))
      : categories;
  const showList = open && suggestions.length > 0;
  const optionId = (index: number) => `${listId}-option-${index}`;

  function close() {
    setOpen(false);
    setFiltering(false);
    setActiveIndex(-1);
  }

  function select(category: string) {
    setValue(category);
    close();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!showList) {
        setOpen(true);
      } else if (event.key === "ArrowDown") {
        setActiveIndex((index) => (index + 1) % suggestions.length);
      } else {
        setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
      }
    } else if (event.key === "Enter" && showList && activeIndex >= 0) {
      event.preventDefault();
      select(suggestions[activeIndex]);
    }
  }

  // The dialog handles Escape on `document` in the capture phase, so only a
  // listener on `window` runs early enough to close the list and keep the dialog open.
  useEffect(() => {
    if (!showList) return;

    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      setFiltering(false);
      setActiveIndex(-1);
    }

    window.addEventListener("keydown", onEscape, { capture: true });
    return () => window.removeEventListener("keydown", onEscape, { capture: true });
  }, [showList]);

  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(`${listId}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listId]);

  return (
    <div className="relative">
      <Input
        {...props}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setFiltering(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={close}
        onKeyDown={onKeyDown}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Categories already used"
          // Keeps focus on the input, so clicking an option or the scrollbar doesn't close the list.
          onMouseDown={(event) => event.preventDefault()}
          // Opens upward: dialogs scroll their content, so a list below this last field would be cut off.
          className="absolute bottom-full z-10 mb-1 max-h-40 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {suggestions.map((category, index) => (
            <li
              key={category}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => select(category)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "cursor-default truncate rounded-sm px-2 py-1.5 text-sm select-none",
                index === activeIndex && "bg-accent text-accent-foreground",
              )}
            >
              {category}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
