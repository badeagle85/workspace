"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  error?: boolean;
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  placeholder = "검색...",
  emptyText = "결과 없음",
  className,
  error,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [width, setWidth] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  // 선택된 값이 변경되면 input 값도 업데이트
  React.useEffect(() => {
    if (selectedOption) {
      setInputValue(selectedOption.label);
    }
  }, [selectedOption]);

  // 컨테이너 너비 측정
  React.useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // 필터링된 옵션
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={containerRef} className={cn("relative", className)}>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (!open) setOpen(true);
              // 입력 중이면 선택 해제
              if (value && e.target.value !== selectedOption?.label) {
                onValueChange("");
              }
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // 선택된 값이 있으면 그 값으로 복원
              setTimeout(() => {
                if (selectedOption) {
                  setInputValue(selectedOption.label);
                }
              }, 150);
            }}
            placeholder={placeholder}
            className={cn(
              "w-full",
              error && "border-red-500"
            )}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0"
        align="start"
        sideOffset={4}
        style={{ width: width > 0 ? width : undefined }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setInputValue(option.label);
                    setOpen(false);
                    inputRef.current?.blur();
                  }}
                  className="justify-between"
                >
                  {option.label}
                  {value === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
