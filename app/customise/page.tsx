import type { Metadata } from "next";

import { Customiser } from "./customiser";

export const metadata: Metadata = {
  title: "Customise",
  description: "Adjust the Filter Bar's density, chip shape and accent, and copy the CSS.",
};

export default function CustomisePage() {
  return <Customiser />;
}
