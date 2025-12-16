import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export function Sidebar({ open, setOpen, children }) {
  return (
    <motion.aside
      animate={{ width: open ? 260 : 72 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className="h-full bg-white border-r shadow-sm flex flex-col pt-6"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </motion.aside>
  );
}

export function SidebarBody({ children, className }) {
  return (
    <div
      className={clsx(
        "flex-1 px-3 pt-4 pb-3 flex flex-col gap-1 overflow-y-auto overflow-x-hidden",
        className
      )}
      style={{ alignItems: 'flex-start' }}
    >
      {children}
    </div>
  );
}

export function SidebarLink({
  icon,
  label,
  active = false,
  onClick,
  open = true,
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
        open ? 'justify-start' : 'justify-center',
        active
          ? "bg-emerald-50 text-emerald-700"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <span className="text-lg">{icon}</span>
      {open && (
        <span className="whitespace-nowrap">{label}</span>
      )}
    </button>
  );
}
