import { Toaster as Sonner } from "sonner";
import { useLanguage } from "@/lib/i18n";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { t } = useLanguage();
  return (
    <Sonner
      containerAriaLabel={t("Notifications")}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!rounded-[20px] group-[.toaster]:!bg-popover group-[.toaster]:!text-foreground group-[.toaster]:!border-border group-[.toaster]:!font-sans group-[.toaster]:!text-label",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground group-[.toast]:!rounded-full group-[.toast]:!px-3 group-[.toast]:!font-semibold",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
