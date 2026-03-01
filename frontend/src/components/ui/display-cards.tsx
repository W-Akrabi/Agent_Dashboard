import { cn } from '@/lib/utils';

export interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon,
  title = 'event',
  description = 'Agent activity',
  date = 'Just now',
  iconClassName,
  titleClassName,
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        'relative flex h-36 w-[22rem] select-none flex-col justify-between rounded-xl border border-white/10 bg-[#0D0E1A] p-4 shadow-2xl',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn(iconClassName)}>{icon}</span>
        <p className={cn('text-sm font-mono font-medium', titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-sm text-[#F4F6FF]">{description}</p>
      <p className="text-xs text-[#A7ACBF]">{date}</p>
    </div>
  );
}

export interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards = [] }: DisplayCardsProps) {
  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center">
      {cards.map((cardProps, i) => (
        <DisplayCard
          key={i}
          className={cn(
            '[grid-area:stack]',
            i === 0 &&
              'translate-x-10 translate-y-10 rotate-[6deg] [mask-image:linear-gradient(to_top,transparent_5%,black_50%)]',
            i === 1 &&
              'translate-x-5 translate-y-5 rotate-[3deg] [mask-image:linear-gradient(to_top,transparent_5%,black_60%)]',
            i === 2 && 'translate-y-0',
          )}
          {...cardProps}
        />
      ))}
    </div>
  );
}
