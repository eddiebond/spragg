"use client";

import { createContext, useContext, ReactNode } from "react";

interface ShowDetails {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
}

const showDetails: ShowDetails = {
  title: "Midlife High Five Deep Dive",
  description: "Description coming soon...",
  location: "Recorded in Austin, TX",
  startTime: "Start time coming soon...",
  endTime: "End time coming soon...",
};

const ShowContext = createContext<ShowDetails>(showDetails);

export function ShowProvider({ children }: { children: ReactNode }) {
  return (
    <ShowContext.Provider value={showDetails}>{children}</ShowContext.Provider>
  );
}

export function useShow() {
  return useContext(ShowContext);
}
