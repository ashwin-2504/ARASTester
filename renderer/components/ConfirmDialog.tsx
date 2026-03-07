import { useConfirmDialog } from "@/lib/hooks/useConfirmDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog() {
  const { isOpen, options, onConfirm, onCancel } = useConfirmDialog();

  if (!options) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {options.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {options.cancelText || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction 
            asChild
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            <Button variant={options.variant || "default"}>
              {options.confirmText || "Confirm"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
