// // src/components/DashboardPage.tsx
// // "use-client";
import React from "react";
// import CostPage from "./cost/page";
import { CostProvider } from "@/context/CostContext";
import Cost from "./cost";
import InstancesList from "./ec2Table";
import Overview from "./overview";
import { Ec2Provider } from "@/context/EC2Context";
// import MockInstances from "@/components/MockInstances";
const DashboardPage: React.FC = () => {
    return (
        // Main container now uses flexbox and takes the full screen height
        <main className="bg-slate-50 h-full flex flex-col p-3 sm:p-4 lg:p-6">
            <div className="mx-auto w-full flex flex-col flex-grow">
                <CostProvider>
                    {/* Inline stacked layout: Stats -> Cost Overview -> Cost Section -> EC2 Section */}
                    {/* <InstancesProvider> */}
                    <div className="flex flex-col gap-4 sm:gap-5">
                        <section className="bg-white rounded-xl shadow-md p-3">
                            <Ec2Provider>
                                <Overview />
                            </Ec2Provider>
                        </section>

                        <section className="bg-white rounded-xl shadow-md p-3">
                            {/* <CostSection /> */}
                            <Cost />
                            {/* <CostComponent /> */}
                        </section>

                        {/* <section className="bg-white rounded-xl shadow-md p-3" id="instances"> */}
                        {/* <MockInstances /> */}
                        {/* </section> */}
                        <InstancesList />
                    </div>
                    {/* </InstancesProvider> */}
                </CostProvider>
            </div>
        </main>
    );
};

export default DashboardPage;
