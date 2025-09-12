"use-client";
import React, { ReactElement } from "react";

import { CostProvider } from "@/context/CostContext";
import { Ec2Provider } from "@/context/EC2Context";
import Cost from "./cost/cost";
import InstancesList from "./ec2-table";
import Overview from "./overview";

const DashboardPage: React.FC = (): ReactElement => (
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

export default DashboardPage;
