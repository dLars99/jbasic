import { ComponentProps } from "react";
import { IconType } from "react-icons";

type ButtonProps = ComponentProps<"button"> & {
  icon: IconType;
};

export const Button = ({ icon: Icon, children, className, ...buttonProps }: ButtonProps) => {
  return (
    <button {...buttonProps} className={`button ${className ?? ""}`}>
      <div className="button-content">
        <Icon className="icon" />

        {children}
      </div>
    </button>
  )
}