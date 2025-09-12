// // src/components/DashboardPage.tsx
// // "use-client";
import React from "react";
// import CostPage from "./cost/page";
import { CostProvider } from "@/context/CostContext";
import { Ec2Provider } from "@/context/EC2Context";
import Cost from "./cost";
import InstancesList from "./ec2Table";
import Overview from "./overview";
// import MockInstances from "@/components/MockInstances";
const DashboardPage: React.FC = () => {
    return (
        // Main container now uses flexbox and takes the full screen height
        <main className="bg-slate-50 h-full flex flex-col p-3 sm:p-4 lg:p-6">
            <div className="mx-auto w-full flex flex-col flex-grow">
                <CostProvider>
                    <div className="flex flex-col gap-4 sm:gap-5">
                        <section className="bg-white rounded-xl shadow-md p-3">
                            <Ec2Provider>
                                <Overview />
                            </Ec2Provider>
                        </section>

                        <section className="bg-white rounded-xl shadow-md p-3">
                            <Cost />
                        </section>

                        <InstancesList />
                    </div>
                </CostProvider>
            </div>
        </main>
    );
};

export default DashboardPage;
