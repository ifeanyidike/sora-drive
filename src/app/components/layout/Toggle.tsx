import React, { FC, ReactElement, SVGProps, useState } from "react";
import { Check, LayoutGrid, Menu } from "lucide-react";

interface SegmentedToggleProps {
  onLeftClick: () => void;
  onRightClick: () => void;
  defaultSelected?: "left" | "right";
}

const Toggle: React.FC<SegmentedToggleProps> = ({
  onLeftClick,
  onRightClick,
  defaultSelected = "right",
}) => {
  const [selected, setSelected] = useState<"left" | "right">(defaultSelected);

  const handleLeftClick = () => {
    setSelected("left");
    onLeftClick();
  };

  const handleRightClick = () => {
    setSelected("right");
    onRightClick();
  };

  return (
    <div className="flex rounded-full overflow-hidden border border-gray-300 w-fit">
      <Button
        action={handleLeftClick}
        selectState="left"
        selected={selected}
        activeIcon={<Check />}
        icon={<Menu />}
      />

      <Button
        action={handleRightClick}
        selectState="right"
        selected={selected}
        activeIcon={<Check />}
        icon={<LayoutGrid />}
      />
    </div>
  );
};

export default Toggle;

type FileIcon = ReactElement<SVGProps<SVGSVGElement>>;
type Props = {
  selected: "left" | "right";
  selectState: "left" | "right";
  action: () => void;
  icon: FileIcon;
  activeIcon: FileIcon;
};

const Button: FC<Props> = ({
  selectState,
  selected,
  action,
  icon,
  activeIcon,
}) => {
  const isActive = selected === selectState;
  const renderIcon = (el: FileIcon) =>
    React.cloneElement(el, {
      className: `w-2.5 h-2.5 md:w-4.5 md:h-4.5 ${
        el.props?.className || ""
      }`.trim(),
    });
  return (
    <button
      onClick={action}
      className={`flex items-center justify-center py-1 px-2 md:py-2 md:px-6 transition-colors cursor-pointer ${
        isActive
          ? "bg-blue-100 text-blue-600"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      <div className="flex items-center gap-1 md:gap-2">
        {isActive && renderIcon(activeIcon)}
        {renderIcon(icon)}
      </div>
    </button>
  );
};
