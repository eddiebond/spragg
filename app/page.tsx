import Image from "next/image";
import TicketDialog from "@/components/TicketDialog";
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
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center mb-2 p-4">
        <Image
          src={"/9thapril.svg"}
          alt={show.title}
          width={400}
          height={400}
          className="mix-blend-exclusion
          
"
          priority
        />
        <Image
          src={"/midlifehighfivedeepdive.svg"}
          alt={show.title}
          width={400}
          height={400}
          className="mix-blend-exclusion
"
          priority
        />
        <Image
          src={"/hollowaynorwich.svg"}
          alt={show.title}
          width={400}
          height={400}
          className="mix-blend-exclusion
"
          priority
        />

        <Image
          src={"/iamdoingthisagain.svg"}
          alt={show.title}
          width={400}
          height={400}
          className="mix-blend-exclusion
"
          priority
        />
        <Image
          src={"/youshouldcome.svg"}
          alt={show.title}
          width={400}
          height={400}
          className="mix-blend-exclusion
"
          priority
        />
        <Image
          src={"/andwatchit.svg"}
          alt={show.title}
          width={400}
          height={400}
          className="mix-blend-exclusion
"
          priority
        />
        <Image
          src={"/somethingspeoplesaid.svg"}
          alt={show.title}
          width={400}
          height={400}
          className="mix-blend-exclusion
"
          priority
        />
        <Image
          src={"/testimonials.svg"}
          alt={show.title}
          width={400}
          height={400}
          className="mix-blend-exclusion
"
          priority
        />
        <Image
          src={"/absolutelynot.png"}
          alt={show.title}
          width={400}
          height={400}
        />
      </div>

      <div className="sticky bottom-0 max-sm:bg-black p-4 text-white w-full flex items-center justify-center">
        <TicketDialog />
      </div>

      {/* <TicketForm /> */}
    </div>
  );
}
