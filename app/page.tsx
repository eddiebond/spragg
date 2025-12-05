import Image from "next/image";
import TicketForm from "@/components/TicketForm";
import { getShowData } from "@/lib/show";

export default async function Home() {
  const show = await getShowData();

  if (!show || !show.title) {
    return (
      <div className="p-8">
        <p>Show details coming soon...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Image
        src="/text.svg"
        alt={
          "I'm doing a one man show probably called 'Midlife Highfive Deepdive' you should come and watch it."
        }
        width={200}
        height={200}
        className="w-full h-auto"
      />

      <hr className="my-8" />

      <Image
        src="/info.svg"
        alt={"23rd January 2026 - The Holloway, Norwich"}
        width={200}
        height={200}
        className="w-full h-auto"
      />

      <TicketForm />
    </div>
  );
}
