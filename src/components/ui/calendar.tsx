import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker";
import { format, setMonth, setYear } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CustomCaption({ displayMonth }: CaptionProps) {
  const { goToMonth } = useNavigation();

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2024, i, 1);
    return { value: i.toString(), label: format(d, "LLLL", { locale: ptBR }) };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => {
    const y = currentYear - 10 + i;
    return { value: y.toString(), label: y.toString() };
  });

  return (
    <div className="flex items-center justify-between px-1 gap-1">
      <Select
        value={displayMonth.getMonth().toString()}
        onValueChange={(v) => goToMonth(setMonth(displayMonth, parseInt(v)))}
      >
        <SelectTrigger className="h-7 text-xs font-medium border-none bg-transparent shadow-none hover:bg-accent px-2 gap-1 min-w-0 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs capitalize">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={displayMonth.getFullYear().toString()}
        onValueChange={(v) => goToMonth(setYear(displayMonth, parseInt(v)))}
      >
        <SelectTrigger className="h-7 text-xs font-medium border-none bg-transparent shadow-none hover:bg-accent px-2 gap-1 w-[72px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {years.map((y) => (
            <SelectItem key={y.value} value={y.value} className="text-xs">
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        row: "flex w-full mt-0",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
