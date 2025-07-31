---
title: High-Performance Edge AI Cluster
---

# **Architecting a High-Performance Edge AI Cluster on the Turing Pi 2 with Kubernetes and NVIDIA Jetson**

## **Section 1: Foundational Hardware and System Preparation**

The successful implementation of a resilient and high-performance Kubernetes cluster begins with a meticulous approach to its physical and software foundations. This section provides a detailed blueprint for the hardware assembly, component placement, and initial system configuration of the Turing Pi 2-based cluster. A deep understanding of the platform's specific characteristics, particularly its I/O topology, is paramount, as these physical constraints dictate the logical architecture of the entire system.

### **1.1 System Architecture Overview: The Turing Pi 2 Ecosystem**

The specified hardware constitutes a heterogeneous ARM-based cluster, combining general-purpose compute with a specialized AI accelerator. Each component has a distinct role informed by its capabilities and its integration within the Turing Pi 2 platform.

#### **Component Deep Dive**

The cluster is composed of the following core hardware:

* **Turing Pi 2.5 Board:** This Mini-ITX motherboard serves as the cluster's backbone. It features four 260-pin SO-DIMM sockets capable of hosting a mix of compute modules. Key to its function is an onboard 1GbE L2 managed switch that provides networking between the nodes. Storage and expansion capabilities include two SATA III ports, four M.2 Key-M slots supporting NVMe SSDs, and two Mini PCIe slots. A critical feature for bare-metal management is the integrated Baseboard Management Controller (BMC), which allows for out-of-band operations such as OS flashing and power cycling via a command-line interface or web UI.1  
* **Turing RK1 Compute Modules (x3):** These modules provide the general-purpose compute power for the cluster. Each is built around the Rockchip RK3588 System-on-Chip (SoC), which features an 8-core DynamIQ CPU configuration (4x ARM Cortex-A76 and 4x ARM Cortex-A55). Each module is equipped with 8GB of LPDDR4 RAM and a Neural Processing Unit (NPU) capable of 6 TOPS. Crucially, these modules are compatible with the M.2 NVMe slots on the Turing Pi 2 board, enabling high-speed local storage.3  
* **NVIDIA Jetson Orin NX 16GB Card (x1):** This module is a high-performance AI accelerator. It features an 8-core ARM Cortex-A78AE CPU and a 1024-core NVIDIA Ampere architecture GPU with 32 Tensor Cores. This combination delivers up to 100 TOPS (at INT8 precision), making it exceptionally well-suited for demanding AI inference workloads. Its inclusion transforms the cluster from a simple compute platform into a capable edge AI system.6

#### **Critical I/O Topology Analysis**

A critical examination of the Turing Pi 2's physical I/O topology reveals a fundamental architectural constraint that must be addressed before any software is installed. The board's high-speed storage interfaces, namely the M.2 NVMe and SATA ports, are not homogenously available to all four compute module slots.8 The M.2 slots are specifically mapped to certain node positions, a feature designed for modules like the Turing RK1. Conversely, the SATA ports are typically associated with a different, specific node slot (e.g., Node 3).10  
This physical mapping directly informs the node placement strategy. The user's requirement to use Longhorn, a distributed block storage system, necessitates a resilient storage pool. For reliable performance, Longhorn requires at least three nodes, each with access to a dedicated, high-performance block storage device; using SD cards is strongly discouraged due to their poor I/O performance and endurance.12 Consequently, it is imperative that the three Turing RK1 modules are installed in the slots that provide direct access to the M.2 NVMe interfaces. This decision predetermines the roles of the hardware: the RK1s will form the storage and general compute layer, while the NVIDIA Jetson, occupying the remaining slot, is designated as a specialized compute node, detached from the primary storage fabric.

#### **Node Role and Placement Strategy**

Based on the I/O analysis, the following node configuration plan is established. This plan serves as the foundational source of truth for the entire cluster build, mapping physical components to their logical roles and network identities.

| Node Slot | Module Type | Hostname | Static IP Address | Kubernetes Role | Storage Role | Physical Storage Device |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Turing RK1 8GB | k3s-server-1 | 192.168.1.10 | Control Plane, Worker | Longhorn Storage Node | /dev/nvme0n1 |
| 2 | Turing RK1 8GB | k3s-server-2 | 192.168.1.11 | Control Plane, Worker | Longhorn Storage Node | /dev/nvme0n1 |
| 3 | Turing RK1 8GB | k3s-server-3 | 192.168.1.12 | Control Plane, Worker | Longhorn Storage Node | /dev/nvme0n1 |
| 4 | Jetson Orin NX 16GB | k3s-jetson-1 | 192.168.1.20 | Worker | AI Accelerator | (eMMC/SD Card Only) |

### **1.2 Assembly and Initial Configuration**

With the architectural plan defined, the next phase involves physical assembly and foundational OS configuration. Consistency and automation in these steps are crucial for building a stable and manageable cluster.

#### **Physical Assembly**

The initial hardware setup involves seating each compute module into its designated SO-DIMM slot on the Turing Pi 2 board. It is essential to apply thermal paste and attach the appropriate heatsinks to each module to ensure adequate thermal dissipation, especially for the high-performance RK1 and Jetson Orin NX SoCs.15 The board is powered by a standard 24-pin ATX power supply. Given the potential power draw of the fully populated board under load, a quality power supply unit (PSU), such as a PicoPSU or a standard ATX PSU, is recommended.10

#### **OS Flashing via Turing Pi BMC**

The Turing Pi's Baseboard Management Controller (BMC) provides a robust and efficient mechanism for flashing operating systems to the compute modules, obviating the need to remove them from the board. This can be accomplished via the tpi command-line tool or the BMC's web interface.1 This out-of-band management capability is a significant advantage for bare-metal cluster administration, allowing for remote recovery and reprovisioning.18

* **RK1 Nodes:** The three Turing RK1 modules should be flashed with **Ubuntu Server 22.04 LTS (arm64)**. This distribution is officially supported by Turing Pi for the RK1 and provides a stable, long-term support base with the necessary kernel features and packages for running K3s and its dependencies.3  
* **Jetson Orin NX Node:** Flashing the **NVIDIA JetPack OS** is mandatory for the Jetson module. JetPack is NVIDIA's software development kit that includes the Linux for Tegra (L4T) operating system, CUDA Toolkit, cuDNN, TensorRT, and the NVIDIA Container Toolkit. These components are non-negotiable prerequisites for enabling GPU acceleration within the Kubernetes cluster. Attempting to use a generic Linux distribution will result in an inability to access the GPU.20 The official NVIDIA documentation should be followed for the JetPack flashing procedure.

#### **Foundational System Setup (Post-Flash)**

After flashing, each of the four nodes must undergo a consistent baseline configuration. This process should be scripted or automated using a tool like Ansible to ensure uniformity and prevent configuration drift.

* **Static Networking:** Each node must be configured with the static IP address defined in the node plan. This ensures predictable network communication, which is a hard requirement for a stable Kubernetes control plane and etcd datastore.22  
* **SSH Hardening:** For security, password-based SSH authentication should be disabled. Access should be restricted to public key authentication only. The public keys of the administrator's machine should be added to the authorized\_keys file for the appropriate user on each node.19  
* **Hostname and Host File Configuration:** Each node must be assigned its unique hostname as specified in the plan (e.g., k3s-server-1). Furthermore, the /etc/hosts file on all four nodes should be populated with entries mapping the static IPs to the hostnames of all other nodes in the cluster. This aids in name resolution during the cluster bootstrapping phase before the internal Kubernetes DNS service is operational.20  
* **System Updates:** An initial update and upgrade of all system packages should be performed on each node to ensure all software is current and security patches are applied. This is typically done with sudo apt update && sudo apt upgrade \-y.23

## **Section 2: Implementing the Kubernetes Control Plane with K3s**

With the hardware and operating systems prepared, the next phase is to construct the Kubernetes cluster. K3s is selected as the Kubernetes distribution for its resource efficiency and strong support for ARM architectures, making it an ideal fit for this edge computing platform. The goal is to establish a resilient, high-availability control plane on the RK1 nodes and integrate the Jetson as a specialized worker.

### **2.1 Rationale for K3s in an Edge/ARM Environment**

The choice of a Kubernetes distribution is a critical architectural decision. For this specific hardware configuration, K3s presents compelling advantages over other distributions like MicroK8s or a full kubeadm deployment.

* **Lightweight and Efficient:** K3s is a fully CNCF-certified Kubernetes distribution that has been stripped down and packaged as a single binary of less than 70MB. It has significantly lower CPU and RAM requirements compared to upstream Kubernetes, making it exceptionally well-suited for the 8GB RAM of the Turing RK1 modules and other resource-constrained edge devices.25 This efficiency ensures that more system resources are available for running application workloads rather than being consumed by the Kubernetes control plane itself.28  
* **ARM64 Native Support:** K3s is developed with ARM architectures as a primary target. It provides fully supported, optimized binaries for ARM64, ensuring seamless compatibility and performance on both the Rockchip RK3588 (in the RK1s) and the NVIDIA Cortex-A78AE (in the Jetson Orin NX).27  
* **Simplified Operations:** K3s simplifies cluster setup and management by bundling essential components. It includes an embedded etcd datastore, which allows for the creation of a high-availability (HA) control plane without the complexity of managing an external etcd cluster. Its auto-deploying manifest feature also streamlines the installation of additional components.29

### **2.2 Bootstrapping a High-Availability K3s Cluster**

The implementation strategy focuses on creating a robust 3-node control plane using the RK1 modules for resilience, and then joining the Jetson as a dedicated, non-control-plane worker. A naive installation of K3s would include default components that are not optimal for this advanced bare-metal architecture. Therefore, a customized installation with proactive disabling of these defaults is required.

#### **Control Plane Node (First RK1)**

On the first RK1 node (k3s-server-1), initialize the cluster using the following command. Each flag is chosen for a specific architectural reason:

Bash

curl \-sfL https://get.k3s.io | sh \-s \- server \\  
  \--cluster-init \\  
  \--disable servicelb \\  
  \--disable traefik \\  
  \--flannel-backend=none \\  
  \--disable-network-policy \\  
  \--node-label node-type=general-compute \\  
  \--tls-san \<LOAD\_BALANCER\_IP\>

* \--cluster-init: This flag initializes a new HA cluster using the embedded etcd datastore.  
* \--disable servicelb: This is a critical step. K3s includes a basic service load balancer called Klipper. As this architecture will use MetalLB for a more robust LoadBalancer service implementation, the default must be disabled to prevent port conflicts and unpredictable behavior.25  
* \--disable traefik: While Traefik is a capable ingress controller, the NGINX Ingress Controller will be installed separately due to its widespread adoption and extensive community documentation. Disabling the default prevents managing two ingress controllers.  
* \--flannel-backend=none \--disable-network-policy: The default Flannel CNI (Container Network Interface) is disabled. This is a deliberate choice to allow for the installation of a more advanced CNI like Cilium later, which provides superior observability, security, and performance features.32  
* \--node-label node-type=general-compute: This proactively applies a label to the node during registration, which simplifies workload scheduling later. All RK1 nodes will share this label to identify them as the general-purpose compute pool.25  
* \--tls-san \<LOAD\_BALANCER\_IP\>: This adds a Subject Alternative Name to the Kubernetes API server's certificate. This should be the virtual IP address that will later be configured to float between the control plane nodes, ensuring clients can always reach the API server.

#### **Joining Additional Control Plane Nodes (Second and Third RK1s)**

To achieve high availability, the other two RK1 nodes (k3s-server-2 and k3s-server-3) must join the cluster as servers. First, retrieve the join token from the initialized server (k3s-server-1):

Bash

sudo cat /var/lib/rancher/k3s/server/node-token

Then, on the other two RK1 nodes, execute the join command, ensuring they also join as servers and receive the appropriate label:

Bash

curl \-sfL https://get.k3s.io | K3S\_URL=https://\<IP\_OF\_K3S\_SERVER\_1\>:6443 K3S\_TOKEN=\<TOKEN\_FROM\_PREVIOUS\_STEP\> sh \-s \- server \\  
  \--node-label node-type=general-compute \\  
  \--tls-san \<LOAD\_BALANCER\_IP\>

This configuration creates a 3-node HA control plane with a resilient, distributed etcd datastore. The cluster can tolerate the failure of one control plane node without losing API availability, providing an enterprise-grade level of resilience for the core cluster services.26

#### **Joining the Jetson Orin NX as a Specialized Worker Node**

The Jetson node (k3s-jetson-1) joins the cluster as a worker-only agent. It will not participate in the control plane or etcd. It uses the same token but is installed with the agent subcommand:

Bash

curl \-sfL https://get.k3s.io | K3S\_URL=https://\<IP\_OF\_K3S\_SERVER\_1\>:6443 K3S\_TOKEN=\<TOKEN\_FROM\_PREVIOUS\_STEP\> sh \-s \- agent \\  
  \--node-label node-type=ai-accelerator

* \--node-label node-type=ai-accelerator: This distinct label is crucial. It programmatically identifies the Jetson node as having specialized hardware. This label will be the target for nodeAffinity rules to ensure that only AI workloads are scheduled onto this powerful but resource-specific node.16

### **2.3 Cluster Verification and Remote Management**

Once all nodes have been joined, verification is essential. From any of the control plane nodes, execute:

Bash

sudo kubectl get nodes \-o wide

The output should list all four nodes (k3s-server-1, k3s-server-2, k3s-server-3, k3s-jetson-1), each with a STATUS of Ready. The ROLES column should show control-plane,etcd,master for the RK1 nodes and \<none\> or worker for the Jetson node.  
For convenient and secure remote management, the cluster's kubeconfig file should be copied to an administrator's local workstation. On one of the control plane nodes, copy the contents of /etc/rancher/k3s/k3s.yaml. In this copied file, the server address must be changed from https://127.0.0.1:6443 to the public-facing IP of one of the control plane nodes (or the future load balancer IP). This file can then be saved on the local machine (e.g., at \~/.kube/config) to enable full cluster administration using kubectl from a remote terminal.19

## **Section 3: Engineering a Resilient Storage Fabric with Longhorn**

Stateful applications such as databases and object storage require a persistent and reliable storage backend. This section details the deployment of Longhorn, a cloud-native distributed block storage system, to provide an enterprise-grade storage fabric for the cluster. This choice moves beyond simpler, single-point-of-failure solutions to deliver the high availability required by the application stack.

### **3.1 Architectural Decision: Longhorn for Distributed Block Storage**

For a multi-node cluster running stateful services like PostgreSQL, MinIO, and Prometheus, a robust storage solution is not optional.

* **Why Longhorn?** While a Network File System (NFS) server is a simpler alternative, it introduces a critical single point of failure; if the NFS server node fails, all applications depending on that storage will fail.10 Longhorn, a CNCF-graduated project, is designed specifically for Kubernetes and mitigates this risk by creating distributed block storage. It achieves high availability by synchronously replicating each volume across multiple worker nodes. This architecture ensures that if a node hosting a volume replica goes offline, the data remains accessible from replicas on other nodes.34 Longhorn also provides essential enterprise features out-of-the-box, including volume snapshots, backups to S3-compatible targets, and a user-friendly management UI.  
* **ARM64 Support:** Longhorn offers stable, production-ready support for the ARM64 architecture, making it fully compatible with the Turing RK1 nodes that will form the storage layer of this cluster.37

### **3.2 Installation and Configuration of Longhorn Prerequisites**

Longhorn has several system-level dependencies that must be satisfied on every node that will participate in the cluster (both storage and compute-only nodes).

* **System-Level Dependencies:** Longhorn uses the iSCSI protocol to attach its block devices to pods. Therefore, the open-iscsi package must be installed and the iscsid daemon must be running on all nodes in the cluster. Additionally, to support ReadWriteMany (RWX) volumes, an nfs-common (or nfs-utils) client is required. To ensure these dependencies are met consistently across the cluster, it is highly recommended to use the prerequisite installation manifests provided by the Longhorn project. These manifests deploy a DaemonSet that installs the necessary packages on each node.34  
  Bash  
  \# Install open-iscsi  
  kubectl apply \-f https://raw.githubusercontent.com/longhorn/longhorn/v1.6.2/deploy/prerequisite/longhorn-iscsi-installation.yaml

  \# Install NFSv4 client (for RWX support)  
  kubectl apply \-f https://raw.githubusercontent.com/longhorn/longhorn/v1.6.2/deploy/prerequisite/longhorn-nfs-installation.yaml

* **Kernel Modules:** Modern Linux distributions like Ubuntu Server typically include the required kernel modules (iscsi\_tcp, dm\_crypt). However, in minimalist or specialized operating systems, it may be necessary to ensure these modules are explicitly included in the kernel build.18

### **3.3 Deploying Longhorn via Helm**

Helm is the preferred method for deploying Longhorn, as it simplifies the management of its numerous Kubernetes resources and configurations.

* **Helm Chart Installation:** The deployment process begins by adding the official Longhorn Helm repository and creating a dedicated namespace for its components.  
  Bash  
  helm repo add longhorn https://charts.longhorn.io  
  helm repo update  
  helm install longhorn longhorn/longhorn \--namespace longhorn-system \--create-namespace

* **Configuring Node Disks:** By default, Longhorn will attempt to use a directory on the root filesystem of each node for storage. This is not recommended for performance or stability. The architecture must be configured to use the dedicated NVMe SSDs attached to the three RK1 nodes. This is managed through the Longhorn UI or via Kubernetes resource annotations. The Jetson node, lacking a dedicated high-performance disk, should be explicitly excluded from participating as a storage node. This can be achieved by configuring node and disk tags within the Longhorn settings, ensuring that Longhorn's storage scheduler only considers the RK1 nodes for replica placement.13

### **3.4 Best Practices for Longhorn in Resource-Constrained Clusters**

The performance of Longhorn in a compact cluster like the Turing Pi 2 is heavily influenced by network bandwidth and resource allocation. The default settings are often tuned for larger clusters with faster networking, so several optimizations are essential. The 1GbE network interconnect on the Turing Pi 2 board is a significant factor; while the NVMe SSDs can deliver high IOPS locally, all replication traffic is constrained by the network's \~125 MB/s theoretical maximum bandwidth.12 This network limitation makes strategic configuration paramount.

* **Data Locality:** The default Longhorn StorageClass should be configured with dataLocality set to best-effort. This setting instructs the Longhorn scheduler to prioritize placing one replica of a volume on the same node where the pod consuming that volume is scheduled. For read-heavy workloads, this provides a substantial performance boost by allowing the pod to read directly from the local disk via iSCSI, bypassing the 1GbE network entirely. While not a strict guarantee, it significantly reduces network latency for a large portion of I/O operations.14  
* **Replica Count:** The default replica count for a volume is three. In a three-node storage cluster, this means every write operation is synchronously sent over the network to two other nodes, consuming double the network bandwidth for replication. By changing the default replica count to two, the cluster still maintains N-1 redundancy—it can survive the failure of a single storage node—while halving the network traffic required for write replication. This is a critical trade-off that balances high availability with the physical constraints of the 1GbE network.14  
* **Resource Allocation:** Longhorn's components, particularly the instance-manager pods that manage volume engines and replicas, can consume significant CPU and memory. It is crucial to monitor their resource usage and, if necessary, configure guaranteed resource requests. Longhorn provides a global setting for "Guaranteed Instance Manager CPU" which allows administrators to reserve a specific percentage of a node's CPU for these critical processes, preventing them from being starved of resources under heavy load and ensuring the stability of the storage layer.39

## **Section 4: Advanced Networking for Bare-Metal Clusters**

Deploying Kubernetes on bare-metal hardware introduces networking challenges that are transparently handled by cloud providers. Specifically, the mechanisms for exposing applications to external traffic require explicit configuration. This section details the implementation of a two-layer networking stack, using MetalLB and the NGINX Ingress Controller, to provide robust and flexible external access to the applications running on the cluster.

### **4.1 Implementing a Bare-Metal Load Balancer with MetalLB**

* **The Problem:** In a cloud environment, creating a Kubernetes Service of type LoadBalancer triggers the cloud provider's API to provision an external load balancer with a public IP address. On a bare-metal cluster, this functionality does not exist natively. A Service of type LoadBalancer will remain in a Pending state indefinitely because there is no external controller to fulfill the request.48 This is a fundamental barrier to exposing web applications like EducationPub to users on the local network.  
* **The Solution: MetalLB:** MetalLB is the industry-standard solution that implements LoadBalancer services for bare-metal Kubernetes clusters. It operates in two primary modes: Layer 2 and BGP. For a small cluster on a single local area network, Layer 2 mode is the simplest and most effective configuration. In this mode, one node in the cluster takes ownership of the service's external IP address and responds to ARP requests for that IP on the local network. If that node fails, another node automatically takes over, providing a degree of high availability.50  
* **Installation and Configuration:**  
  1. **Prerequisite:** As established in Section 2, the K3s built-in servicelb must be disabled during cluster installation to prevent conflicts with MetalLB.25  
  2. **Deployment:** MetalLB is deployed by applying its official Kubernetes manifests.  
  3. **IP Address Pool Configuration:** After deployment, MetalLB must be configured with a pool of IP addresses it is allowed to manage. This is done by creating an IPAddressPool custom resource. This manifest defines a range of IP addresses from the local network (e.g., 192.168.1.200-192.168.1.210) that MetalLB can assign to any Service of type LoadBalancer.

### **4.2 Deploying the NGINX Ingress Controller**

While a LoadBalancer service provides Layer 4 (TCP/UDP) access to a single service, a more sophisticated approach is needed to manage traffic for a full application stack with multiple web frontends.

* **Role of an Ingress Controller:** An Ingress controller operates at Layer 7 (HTTP/HTTPS) of the network stack. It acts as a reverse proxy and API gateway for the cluster. This allows multiple backend services (e.g., the EducationPub application, the Grafana UI, the Keycloak login page) to be exposed through a single external IP address. The Ingress controller uses rules based on hostnames (e.g., educationpub.local, grafana.local) and URL paths (e.g., /api, /dashboard) to route incoming traffic to the correct backend Service within the cluster.49 This is far more efficient and scalable than assigning a separate external IP to each UI component.  
* **Installation via Helm:** The NGINX Ingress Controller is most easily deployed using its official Helm chart. During installation, the Helm chart will create a Service for the NGINX controller itself. By default, this service is of type LoadBalancer. Once created, MetalLB will detect this service and assign it a single, stable IP address from the configured IPAddressPool. This IP address becomes the single entry point for all HTTP/S traffic into the cluster.

### **4.3 A Practical Guide to Kubernetes Service Types in this Architecture**

The combination of MetalLB and an Ingress controller enables the full spectrum of Kubernetes Service types, each with a specific role.

* **ClusterIP:** This remains the default and most common service type. It provides a stable virtual IP address that is only reachable from within the Kubernetes cluster. It is used for all internal, backend communication. For example, when the EducationPub NodeJS server needs to connect to the PostgreSQL database, it will connect to the ClusterIP of the PostgreSQL service.52  
* **NodePort:** This service type exposes a service on a static port (typically in the 30000-32767 range) on the IP address of every node in the cluster. While it provides external access, it is generally not recommended for production use. It can be cumbersome to manage port numbers, and it requires clients to connect directly to node IPs, which complicates failover and load balancing.55 In this architecture, its primary role is as an underlying mechanism used by the  
  LoadBalancer service.  
* **LoadBalancer:** This service type is the primary method for exposing services to external traffic. In this bare-metal context, it is fully enabled by MetalLB. The only service that should typically be of this type is the NGINX Ingress Controller itself. All other applications are then exposed through the Ingress controller.52  
* **Service Discovery:** The linchpin that enables communication between microservices is the built-in Kubernetes DNS service. When a Service is created, a corresponding DNS A record is automatically generated within the cluster's DNS zone (e.g., postgresql.default.svc.cluster.local). Pods within the cluster can then resolve this service name to its stable ClusterIP. This abstraction is fundamental; it decouples services from one another, as they no longer need to know the ephemeral IP addresses of the pods they are communicating with. Application configurations should always use these service DNS names instead of hardcoded IP addresses.59

The canonical traffic flow for an external user accessing the EducationPub application is as follows: User's Browser \-\> DNS resolution of educationpub.local to MetalLB IP \-\> MetalLB IP on a cluster node \-\> NGINX Ingress Controller Pod \-\> Ingress Rule routing \-\> EducationPub's ClusterIP Service \-\> EducationPub Pod.

## **Section 5: Isolating and Empowering the AI Execution Node**

A central objective of this architecture is to leverage the NVIDIA Jetson Orin NX for dedicated AI workloads. To achieve this effectively, it is not enough to simply have the hardware present; it must be correctly configured within Kubernetes and programmatically isolated to ensure its specialized and power-intensive resources are reserved exclusively for AI tasks. A multi-layered scheduling strategy is required to create this robust isolation.

### **5.1 Configuring the NVIDIA GPU Stack on the Jetson Node**

Before Kubernetes can schedule GPU-aware workloads, the underlying node and container runtime must be configured to recognize and expose the GPU hardware.

* **NVIDIA Container Toolkit:** The NVIDIA JetPack OS, which was installed on the Jetson node, includes the necessary components for GPU-enabled containers, including the NVIDIA Container Toolkit. This toolkit integrates with the containerd runtime used by K3s. K3s is designed to automatically detect the presence of the NVIDIA runtime and configure containerd appropriately. This configuration can be verified by inspecting the config.toml file located at /var/lib/rancher/k3s/agent/etc/containerd/config.toml. The file should contain a runtime entry for nvidia, and it should be set as the default runtime to ensure that all containers on the node can leverage the GPU if needed.20  
* **NVIDIA Device Plugin for Kubernetes:** The physical GPU is invisible to the Kubernetes scheduler by default. The bridge between the hardware and the Kubernetes control plane is the NVIDIA Device Plugin. This component must be deployed to the cluster as a DaemonSet, which ensures it runs on every node. On the Jetson node, the plugin will detect the presence of the Ampere GPU via the installed drivers. It then communicates with the local kubelet to advertise the GPU as a new, schedulable resource type within the cluster, named nvidia.com/gpu. Only after this plugin is running and has successfully registered the GPU can pods request and be allocated GPU resources.20 The plugin is typically installed via its official Helm chart or YAML manifest.

### **5.2 A Multi-Layered Strategy for Workload Isolation**

To ensure the Jetson node is exclusively used for AI workloads and that general-purpose pods (like a Redis cache instance) are not scheduled onto it, a combination of Kubernetes scheduling features must be employed. Relying on a single mechanism is insufficient and can lead to resource contention or scheduling failures.

* **Step 1: Tainting the Jetson Node:** The first layer of isolation is to apply a taint to the Jetson node. A taint acts as a repellent; it marks the node so that the scheduler will not place any pods on it unless a pod has a specific toleration for that taint. This effectively prevents all standard, non-AI pods from being scheduled on the Jetson.  
  Bash  
  kubectl taint node k3s-jetson-1 nvidia.com/gpu=true:NoSchedule

  The NoSchedule effect means that no new pods will be scheduled on the node unless they tolerate this specific taint.67  
* **Step 2: Labeling the Jetson Node:** The second layer is positive identification. As configured during the K3s installation, the Jetson node already has the label node-type=ai-accelerator. This label serves as a target for scheduling rules, explicitly identifying the node's special capabilities.70  
* **Step 3: Configuring AI Pods with Tolerations and Node Affinity:** For any AI workload that is intended to run on the Jetson, its pod manifest must include three specific configurations:  
  1. **Toleration:** The pod spec must include a toleration that precisely matches the taint applied in Step 1\. This acts as a "permission slip," allowing the scheduler to consider placing the pod on the tainted Jetson node.  
     YAML  
     tolerations:  
     \- key: "nvidia.com/gpu"  
       operator: "Exists"  
       effect: "NoSchedule"

  2. **Node Affinity:** The pod spec must also include a nodeAffinity rule. This rule attracts the pod to nodes with specific labels. By using a requiredDuringSchedulingIgnoredDuringExecution rule, this becomes a hard requirement. The scheduler *must* place the pod on a node that has the node-type=ai-accelerator label. This prevents the AI pod from being scheduled on one of the general-purpose RK1 nodes, even if it has the necessary toleration.72  
     YAML  
     affinity:  
       nodeAffinity:  
         requiredDuringSchedulingIgnoredDuringExecution:  
           nodeSelectorTerms:  
           \- matchExpressions:  
             \- key: node-type  
               operator: In  
               values:  
               \- ai-accelerator

  3. **GPU Resource Request:** Finally, the container within the pod must explicitly request the GPU resource that was advertised by the device plugin. This tells the scheduler that the pod requires one GPU unit to function.  
     YAML  
     resources:  
       limits:  
         nvidia.com/gpu: 1

This three-part configuration creates a robust and complete isolation strategy. The taint repels all general pods, while the combination of the toleration and the required node affinity ensures that AI pods are not only allowed on the Jetson but are exclusively scheduled there.

### **5.3 Verification: Deploying a CUDA Workload**

To validate the entire GPU stack and isolation strategy, a simple test pod can be deployed. This pod will run a basic CUDA application, such as the deviceQuery utility from the NVIDIA CUDA samples, which inspects and reports on the available GPU hardware.  
The manifest for this test pod must include the toleration, the required node affinity, and the GPU resource limit as described above. After applying the manifest, the following should be verified:

1. The pod schedules successfully and enters a Running state.  
2. Using kubectl describe pod \<pod-name\>, the Events section shows it was successfully scheduled.  
3. Using kubectl get pod \<pod-name\> \-o wide, the NODE column confirms it is running on k3s-jetson-1.  
4. Checking the pod's logs with kubectl logs \<pod-name\> should show the output of the deviceQuery command, confirming that the container successfully accessed the Jetson's GPU.76

## **Section 6: Deploying the "EducationPub" Application Stack**

This section provides the practical implementation details for deploying the complete "EducationPub" application stack onto the configured Kubernetes cluster. The primary focus is on ensuring ARM64 compatibility for all components and leveraging Kubernetes-native patterns for configuration and inter-service communication.

### **6.1 Sourcing and Verifying ARM64-Compatible Images and Charts**

The most significant operational challenge when working with an ARM-based cluster is ensuring that every container image is compiled for the arm64 (or aarch64) architecture. Standard amd64 (x86-64) images will not run and will cause pods to fail with an exec format error.78 Therefore, a rigorous verification process is required for every component in the stack. This can be done by inspecting image tags on Docker Hub or by using a command-line tool like  
docker manifest inspect.

| Component | Helm Chart Source | Container Image Name | Verified ARM64 Tag | Verification Method |
| :---- | :---- | :---- | :---- | :---- |
| PostgreSQL | oci://registry-1.docker.io/bitnamicharts/postgresql | bitnami/postgresql | 16.3.0 | Official Multi-Arch Tag |
| Redis | oci://registry-1.docker.io/bitnamicharts/redis | bitnami/redis | 7.2.5 | Official Multi-Arch Tag |
| Keycloak | oci://registry-1.docker.io/bitnamicharts/keycloak | bitnami/keycloak | 25.0.1 | Official Multi-Arch Tag |
| MinIO | https://charts.min.io/ | minio/minio | RELEASE.2024-07-27T19-28-48Z | Official Multi-Arch Tag |
| Prometheus | https://prometheus-community.github.io/helm-charts | prometheus/prometheus | v2.53.0 | Official Multi-Arch Tag |
| Grafana | https://grafana.github.io/helm-charts | grafana/grafana | 11.1.0 | Official Multi-Arch Tag |
| Loki | https://grafana.github.io/helm-charts | grafana/loki | 3.1.0 | Official Multi-Arch Tag |
| EducationPub | (Custom) | (Custom) | (User-defined) | docker buildx Required |

* **Custom Application (EducationPub Server):** While official images for common open-source tools typically support multiple architectures, the user's custom NodeJS application is a potential point of failure. The Dockerfile for this application must be based on an official ARM64-compatible Node.js image, such as node:20-bullseye.81 Furthermore, the image must be built using a tool capable of cross-platform builds, like  
  docker buildx. A standard docker build on an x86 developer machine will produce an incompatible amd64 image. A multi-stage Dockerfile is recommended to create a small, optimized production image.

### **6.2 Deployment Manifests and Configuration Walkthrough**

The recommended deployment strategy for this complex stack is to use Helm, the de facto package manager for Kubernetes. Helm charts encapsulate all the necessary Kubernetes manifests (Deployments, StatefulSets, Services, etc.) into a single, versioned package. Configuration is externalized into a values.yaml file, which allows for easy customization without altering the underlying chart templates. This approach is superior to managing dozens of individual YAML files and aligns with GitOps best practices.82

* **Stateful Services (PostgreSQL, Redis, MinIO):**  
  * These components will be deployed using their official Helm charts as StatefulSet resources.  
  * A critical configuration override in their respective values.yaml files will be to set the storageClassName to longhorn. This instructs the volumeClaimTemplates in the StatefulSets to request persistent storage from the Longhorn storage fabric, ensuring data is replicated and highly available.  
* **Core Services & Application (Keycloak, EducationPub):**  
  * These will be deployed as Deployment resources via their Helm charts.  
  * For each, a ClusterIP service will be created to facilitate internal communication.  
  * Ingress resources will be defined to expose their web interfaces. For example, an Ingress rule will be created to route traffic for the hostname educationpub.local to the EducationPub service, and another for auth.educationpub.local to the Keycloak service. These rules will be managed by the NGINX Ingress Controller deployed in Section 4\.  
* **Observability (Prometheus, Grafana, Loki):**  
  * The kube-prometheus-stack Helm chart is the standard for deploying a full monitoring stack. It includes Prometheus, Grafana, Alertmanager, and a suite of exporters.  
  * The loki Helm chart will be deployed to create a centralized logging system. Promtail, Loki's agent, will be deployed as a DaemonSet to collect logs from all pods on all nodes.  
  * Prometheus will be configured via ServiceMonitor custom resources to automatically discover and scrape metrics endpoints from the other application components.

### **6.3 Configuring Inter-Service Communication**

A core principle of cloud-native design is the decoupling of services through DNS-based service discovery. The EducationPub NodeJS application must be configured to connect to its dependencies using their Kubernetes service names, not static IP addresses.  
This is typically achieved by passing environment variables to the application's container in its Deployment manifest. For example:

YAML

\# Snippet from EducationPub Deployment manifest  
env:  
\- name: DATABASE\_HOST  
  value: "postgresql-service.database-namespace.svc.cluster.local"  
\- name: DATABASE\_PORT  
  value: "5432"  
\- name: REDIS\_HOST  
  value: "redis-service.cache-namespace.svc.cluster.local"  
\- name: KEYCLOAK\_URL  
  value: "http://keycloak-service.auth-namespace.svc.cluster.local"

The application code then uses these environment variables to construct its connection strings. This ensures that even if the pods providing the PostgreSQL or Redis services are rescheduled and receive new IP addresses, the connection from the EducationPub server will remain stable, as the service name and its corresponding ClusterIP do not change.62

## **Section 7: Performance Analysis and Workload Projections**

This section provides a quantitative and qualitative analysis of the cluster's expected performance. It synthesizes the hardware specifications, known benchmarks for the compute modules, and the resource requirements of the target application stack to project the system's capacity for hosting a decentralized social media platform analogous to Mastodon. The analysis recognizes that the cluster's performance is not a single metric but a balance of compute power, I/O throughput, network limitations, and the overhead of its resilient software layers.

### **7.1 Establishing a Performance Baseline**

* **Turing RK1 Compute:** The Rockchip RK3588 SoC in the Turing RK1 modules provides a substantial performance uplift over previous-generation ARM SoCs like those in the Raspberry Pi family. Benchmarks show the RK1 to be roughly 2x faster than a Raspberry Pi 5 and 5x faster than a Compute Module 4 in standard CPU tasks.87 With three RK1 modules, the cluster has a total of 24 ARM cores (12x high-performance A76, 12x high-efficiency A55) and 24GB of RAM for general-purpose workloads. This forms a solid foundation for the web application, database, and other services.  
* **Jetson Orin NX AI Compute:** The Jetson Orin NX 16GB module is the cluster's powerhouse for AI. Its 1024-core Ampere GPU and 32 Tensor Cores deliver up to 100 TOPS of INT8 inference performance.6 This is a level of performance suitable for running multiple, concurrent, complex AI models in real-time, a capability far exceeding that of the RK1's NPU.  
* **Network and Storage I/O:** The NVMe SSDs connected to the RK1 modules are capable of high-speed local I/O, with benchmarks showing performance in the hundreds of MB/s.89 However, as previously established, all inter-node traffic, including storage replication, is constrained by the 1Gbps (\~125 MB/s) onboard Ethernet switch. This network is the primary bottleneck for distributed operations.

### **7.2 Quantifying the Overhead of Longhorn**

Longhorn provides data resilience through synchronous replication, a process that inherently introduces performance overhead compared to writing to a single, local disk. Benchmarking studies comparing Longhorn volumes to local path provisioners show that this overhead can be significant, with observed reductions in IOPS (Input/Output Operations Per Second) of up to 90% for write-intensive, random I/O workloads.90  
This is an expected trade-off for high availability. For a typical web application workload, which often involves more reads than writes, this level of performance is generally acceptable. The impact will be most pronounced during database-heavy operations, such as bulk data ingestion or complex queries that generate large temporary tables. The use of best-effort data locality will mitigate this for read operations, which can proceed at near-local disk speed. However, all write operations will be paced by the 1GbE network's ability to replicate the data to another node.

### **7.3 AI Inference Capabilities Projection**

The Jetson Orin NX's performance enables a wide range of AI features for the "EducationPub" platform. The following projections are based on published benchmarks for similar hardware.

| AI Model/Task | Benchmark Metric | Projected Performance (INT8) | Potential "EducationPub" Use Case |
| :---- | :---- | :---- | :---- |
| **Computer Vision** |  |  |  |
| Object Detection (YOLOv8/YOLO11) | Frames Per Second (FPS) | 30-60+ FPS on HD streams | Content moderation (detecting inappropriate imagery), automated object tagging, accessibility (describing images). |
| Image Classification (ResNet-50) | Inferences Per Second | \>2500 | Categorizing user-uploaded images, topic-based content filtering. |
| **Natural Language Processing** |  |  |  |
| Small Language Model (Llama 3 8B) | Tokens Per Second | 15-20 tokens/sec | Automated content summarization, generating image descriptions (alt-text), chatbot/support agent, sentiment analysis. |
| Speech-to-Text (RNN-T) | Real-Time Factor | \>1000x | Transcribing uploaded audio/video content for accessibility and searchability. |

References: 92  
The key takeaway is that the cluster possesses an asymmetric power profile. The general-purpose compute is moderate, while the AI inference capability is exceptionally high for a device of this size and power envelope. The AI features are not limited by inference hardware performance; rather, the challenge will be in the development, training, and optimization of the AI models themselves.

### **7.4 EducationPub (as Mastodon) Performance Projection**

To estimate the cluster's capacity, we can model the "EducationPub" server on the architecture and resource requirements of Mastodon, a popular decentralized social media platform.

* **Mastodon Architecture:** A Mastodon instance consists of several key services: a Ruby on Rails web server (Puma), a background job processor (Sidekiq), a PostgreSQL database, and a Redis instance for caching and queuing.96 The most resource-intensive components are typically Sidekiq, which handles federation (communicating with other instances), and PostgreSQL, which manages all user data and posts.  
* **Resource Requirements:** A small, single-user Mastodon instance can run on as little as 2 CPU cores and 2GB of RAM.96 However, resource consumption scales significantly with the number of active users and the degree of federation. A small community instance (10-50 users) is often recommended to have at least 4 cores and 6-8GB of RAM.99  
* **Capacity Estimation for the RK1 Pool:** The three RK1 nodes provide a pool of 24 cores and 24GB of RAM for the application stack. A portion of these resources must be reserved for the Kubernetes system, Longhorn, and the observability stack.

| Component | CPU Request/Limit | Memory Request/Limit | Number of Replicas |
| :---- | :---- | :---- | :---- |
| **System Overhead** |  |  |  |
| K3s & System Daemons | \~1.5 Cores | \~3 GB | (per node) |
| Longhorn | \~1.5 Cores | \~3 GB | (cluster total) |
| Observability Stack | \~1 Core | \~2 GB | (cluster total) |
| **Total Reserved** | **\~4 Cores** | **\~8 GB** |  |
| **Available for Application** | **\~20 Cores** | **\~16 GB** |  |
| **EducationPub/Mastodon Stack** |  |  |  |
| PostgreSQL | 4 Cores / 8 Cores | 4 GB / 8 GB | 1 |
| Redis | 1 Core / 2 Cores | 1 GB / 2 GB | 1 |
| Keycloak | 1 Core / 2 Cores | 1 GB / 2 GB | 2 |
| EducationPub Server (NodeJS) | 2 Cores / 4 Cores | 2 GB / 4 GB | 3 |
| **Total Application Allocation** | **\~8 Cores** | **\~8 GB** |  |

References: 30  
**Projection:** Based on this resource budget, the Turing Pi 2 cluster is well-equipped to handle a **small-to-medium sized instance of 100-1,000 active users**. The 20 available application cores provide ample capacity for web requests (NodeJS/Puma), authentication (Keycloak), and background job processing (Sidekiq). The 16GB of available RAM is sufficient for the database, caching, and application heaps. The primary performance bottlenecks for scaling beyond this range would likely be:

1. **Database I/O:** The performance of PostgreSQL under the overhead of Longhorn's network-replicated storage.  
2. **Network Saturation:** Heavy federation activity, where the Sidekiq workers are constantly sending and receiving updates from many other instances, could saturate the 1GbE network.

## **Section 8: Strategic Concerns and Final Recommendations**

This report has detailed the architecture and implementation of a sophisticated edge AI cluster. However, building the cluster is only the first step. Long-term operational success depends on understanding its inherent limitations, implementing robust security and data protection strategies, and planning for future evolution.

### **8.1 Addressing Inherent Architectural Challenges**

The design choices made throughout this report were intended to maximize the capabilities of the given hardware, but it is crucial to acknowledge the platform's intrinsic constraints.

* **Turing Pi 2 I/O Limitations:** The asymmetric I/O topology is the board's most significant challenge. The strategy of dedicating the three M.2-equipped RK1 nodes to the Longhorn storage pool effectively works around this limitation, creating a resilient storage fabric. However, it solidifies the role of the Jetson as a compute-only node. Any future desire to add the Jetson to the storage pool would be impractical without dedicated, high-performance storage attached to its slot.  
* **1GbE Networking Constraint:** The 1Gbps network is a hard ceiling on the performance of all distributed operations. For the current application scale, it is adequate. However, if the platform were to host extremely high-traffic services or a write-intensive distributed database, this network would become the primary bottleneck. Users should be mindful of this when designing workloads that involve heavy inter-node data transfer.  
* **Power Delivery:** The combined power draw of three RK1 modules and one Jetson Orin NX, especially when the Jetson is under full AI inference load, can be substantial. It is critical to use a high-quality ATX power supply with sufficient wattage (a 300W+ unit is a safe recommendation) to ensure system stability. Inadequate power can lead to random reboots and difficult-to-diagnose stability issues.10

### **8.2 Summary of Gaps Filled**

This architectural plan moves beyond a simple "getting started" guide by filling several critical gaps that are often overlooked in bare-metal Kubernetes deployments:

* **Bare-Metal Service Exposure:** It implements a complete, production-ready solution for external application access using the MetalLB and NGINX Ingress Controller stack, replicating the functionality of a cloud provider's load balancer.  
* **Dedicated Hardware Isolation:** It details a robust, multi-layered strategy combining Kubernetes taints and node affinity to guarantee that the specialized Jetson node is reserved exclusively for AI workloads, preventing resource contention.  
* **Resilient Distributed Storage:** It opts for Longhorn over simpler but fragile solutions like NFS, providing a highly available storage layer that is a prerequisite for running stateful applications in a multi-node cluster.  
* **ARM64 Compatibility Assurance:** It places a strong emphasis on the verification of ARM64 compatibility for every software component, addressing the most common failure point for deployments on this architecture.

### **8.3 Recommendations for Optimization and Scalability**

* **Security Hardening:**  
  * **Network Policies:** The cluster should be configured with a CNI that supports NetworkPolicy resources, such as Cilium. These policies should be used to enforce a principle of least privilege for network communication, explicitly defining which pods are allowed to communicate with each other (e.g., only the EducationPub server can connect to the PostgreSQL database port).  
  * **Secrets Management:** Storing plain-text secrets (like database passwords) in Git is a major security risk. A tool like Bitnami's Sealed Secrets should be used. This allows secrets to be encrypted before being committed to a Git repository, with only the controller running in the cluster able to decrypt them.19  
  * **Regular Updates:** A process should be established for regularly updating the node operating systems, K3s, and all container images to their latest stable versions to incorporate security patches.  
* **Backup and Disaster Recovery:** A comprehensive backup strategy must protect against multiple failure modes.  
  * **Longhorn Backups to MinIO:** Longhorn's built-in backup functionality should be configured to take regular, scheduled snapshots of all persistent volumes and store them in an S3-compatible object store. The in-cluster MinIO instance can serve as the primary backup target for this purpose. This provides rapid recovery from volume corruption or accidental data deletion.104  
  * **Application-Level Database Backups:** Volume snapshots provide a crash-consistent backup. For transactional databases like PostgreSQL, it is best practice to also perform application-aware backups using tools like pg\_dump. These logical backups ensure transactional integrity and are often more portable.42  
  * **Off-Site Backups:** The self-contained backup loop (Longhorn \-\> MinIO) creates a resilient system but also a co-located risk. A catastrophic failure of the Turing Pi 2 board itself would result in the loss of both the primary data and the backups stored on MinIO. To mitigate this, a secondary backup process must be implemented to replicate the MinIO backup data to an off-site location, such as a cloud object storage service (e.g., AWS S3, Backblaze B2) or another NAS on the network. This can be accomplished with a simple cron job running mc mirror.  
* **Future Upgrade Paths:**  
  * If database I/O becomes a significant bottleneck, the PostgreSQL instance could be migrated off the Longhorn storage fabric and onto a dedicated, high-performance server external to the cluster.  
  * As the Turing Pi ecosystem evolves, more powerful compute modules compatible with the board may become available, offering a direct upgrade path for the general-purpose compute nodes.

#### **Works cited**

1. Turing Pi \- Buy Cluster on a mini ITX board with Raspberry Pi, accessed July 30, 2025, [https://turingpi.com/](https://turingpi.com/)  
2. Get Turing Pi 2, mini ITX cluster board, accessed July 30, 2025, [https://turingpi.com/product/turing-pi-2-5/](https://turingpi.com/product/turing-pi-2-5/)  
3. Turing RK1 \- compute module based on Rockchip RK3588, accessed July 30, 2025, [https://turingpi.com/product/turing-rk1/](https://turingpi.com/product/turing-rk1/)  
4. Turing RK1 | Docs \- Intro & Specs, accessed July 30, 2025, [https://docs.turingpi.com/docs/turing-rk1-specs-and-io-ports](https://docs.turingpi.com/docs/turing-rk1-specs-and-io-ports)  
5. (Update) Turing Pi reveals RK1 CM specifications \- Linux Gizmos, accessed July 30, 2025, [https://linuxgizmos.com/update-turing-pi-reveals-rk1-cm-specifications/](https://linuxgizmos.com/update-turing-pi-reveals-rk1-cm-specifications/)  
6. Intro and Specs | Nvidia Jetson Orin / Nano NX \- Turing Pi, accessed July 30, 2025, [https://docs.turingpi.com/docs/nvidia-jetson-orin-nx-intro-specs](https://docs.turingpi.com/docs/nvidia-jetson-orin-nx-intro-specs)  
7. NVIDIA Jetson Orin NX 16 GB Specs | TechPowerUp GPU Database, accessed July 30, 2025, [https://www.techpowerup.com/gpu-specs/jetson-orin-nx-16-gb.c4086](https://www.techpowerup.com/gpu-specs/jetson-orin-nx-16-gb.c4086)  
8. TURING PI 2 \- host Kubernetes, Docker, and Serverless locally, accessed July 30, 2025, [https://www.reddit.com/r/kubernetes/comments/jfbegf/turing\_pi\_2\_host\_kubernetes\_docker\_and\_serverless/](https://www.reddit.com/r/kubernetes/comments/jfbegf/turing_pi_2_host_kubernetes_docker_and_serverless/)  
9. Turing Pi 2 Home cluster \- DEV Community, accessed July 30, 2025, [https://dev.to/tomassirio/turing-pi-2-home-cluster-5edc](https://dev.to/tomassirio/turing-pi-2-home-cluster-5edc)  
10. How to Build a Turing Pi 2 Home Cluster \- HackerNoon, accessed July 30, 2025, [https://hackernoon.com/how-to-build-a-turing-pi-2-home-cluster](https://hackernoon.com/how-to-build-a-turing-pi-2-home-cluster)  
11. Experimenting with k3s and Tailscale \- angrydome, accessed July 30, 2025, [https://angrydome.com/posts/k3s\_tailscale/](https://angrydome.com/posts/k3s_tailscale/)  
12. How To Plan Kubernetes Installation \- Intro & Specs, accessed July 30, 2025, [https://docs.turingpi.com/docs/how-to-plan-kubernetes-installation](https://docs.turingpi.com/docs/how-to-plan-kubernetes-installation)  
13. 6 Raspberry Pis, 6 SSDs on a Mini ITX Motherboard | Jeff Geerling, accessed July 30, 2025, [https://www.jeffgeerling.com/blog/2022/6-raspberry-pis-6-ssds-on-mini-itx-motherboard](https://www.jeffgeerling.com/blog/2022/6-raspberry-pis-6-ssds-on-mini-itx-motherboard)  
14. Best Practices for Longhorn. Introduction | by Peter Olofsson | Medium, accessed July 30, 2025, [https://medium.com/@petolofsson/best-practices-for-longhorn-067d4ccb5fdd](https://medium.com/@petolofsson/best-practices-for-longhorn-067d4ccb5fdd)  
15. Raspberry Pi CM4 Cluster Running Kubernetes \- Turing Pi 2 \- YouTube, accessed July 30, 2025, [https://www.youtube.com/watch?v=9Llchw14cDA\&pp=0gcJCfwAo7VqN5tD](https://www.youtube.com/watch?v=9Llchw14cDA&pp=0gcJCfwAo7VqN5tD)  
16. tylertitsworth/ai-cluster: Turing Pi Cluster with Turing RK1s and Jetson Orin Nanos \- GitHub, accessed July 30, 2025, [https://github.com/tylertitsworth/ai-cluster](https://github.com/tylertitsworth/ai-cluster)  
17. 4 Pis on a mini ITX board\! The Turing Pi 2 \- YouTube, accessed July 30, 2025, [https://www.youtube.com/watch?v=IUPYpZBfsMU](https://www.youtube.com/watch?v=IUPYpZBfsMU)  
18. Deploying Kubernetes on the Turing Pi using RK1 boards and Talos Linux. |, accessed July 30, 2025, [https://xphyr.net/post/kubernetes\_using\_turingpi\_talos\_and\_rk1/](https://xphyr.net/post/kubernetes_using_turingpi_talos_and_rk1/)  
19. Turing Pi V2 K3S Cluster bootstrapping with Ansible and Argo CD. Dependency monitoring and updating with Renovate Bot. Running CI tests with the K8S E2E Framework. \- GitHub, accessed July 30, 2025, [https://github.com/procinger/turing-pi-v2-cluster](https://github.com/procinger/turing-pi-v2-cluster)  
20. Nvidia Jetson \- Intro & Specs \- Turing Pi, accessed July 30, 2025, [https://docs.turingpi.com/docs/turing-pi2-kubernetes-cluster-nvidia-jetson](https://docs.turingpi.com/docs/turing-pi2-kubernetes-cluster-nvidia-jetson)  
21. Initial Setup Guide \- Jetson Orin Nano, accessed July 30, 2025, [https://www.jetson-ai-lab.com/initial\_setup\_jon.html](https://www.jetson-ai-lab.com/initial_setup_jon.html)  
22. turing-pi-2-cluster/README.md at master \- GitHub, accessed July 30, 2025, [https://github.com/geerlingguy/turing-pi-2-cluster/blob/master/README.md](https://github.com/geerlingguy/turing-pi-2-cluster/blob/master/README.md)  
23. Raspberry Pi and microk8s | Rockford Lhotka, accessed July 30, 2025, [https://blog.lhotka.net/2020/09/10/Raspberry-Pi-and-microk8s](https://blog.lhotka.net/2020/09/10/Raspberry-Pi-and-microk8s)  
24. How to run Cluster Management Software K3s on NVIDIA Jetson? \- Seeed Studio, accessed July 30, 2025, [https://www.seeedstudio.com/blog/2021/01/22/how-to-run-cluster-management-software-k3s-on-nvidia-jetson/](https://www.seeedstudio.com/blog/2021/01/22/how-to-run-cluster-management-software-k3s-on-nvidia-jetson/)  
25. Kubernetes Installation \- Intro & Specs \- Turing Pi, accessed July 30, 2025, [https://docs.turingpi.com/docs/turing-pi2-kubernetes-installation](https://docs.turingpi.com/docs/turing-pi2-kubernetes-installation)  
26. Raspberry Pi Cluster Episode 3 \- Installing K3s Kubernetes on the Turing Pi | Jeff Geerling, accessed July 30, 2025, [https://www.jeffgeerling.com/blog/2020/installing-k3s-kubernetes-on-turing-pi-raspberry-pi-cluster-episode-3](https://www.jeffgeerling.com/blog/2020/installing-k3s-kubernetes-on-turing-pi-raspberry-pi-cluster-episode-3)  
27. K3s, accessed July 30, 2025, [https://k3s.io/](https://k3s.io/)  
28. Raspberry Pi Cluster Ep 6 \- Turing Pi Review : r/kubernetes \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/kubernetes/comments/i0o3sl/raspberry\_pi\_cluster\_ep\_6\_turing\_pi\_review/](https://www.reddit.com/r/kubernetes/comments/i0o3sl/raspberry_pi_cluster_ep_6_turing_pi_review/)  
29. k3s-io/k3s: Lightweight Kubernetes \- GitHub, accessed July 30, 2025, [https://github.com/k3s-io/k3s](https://github.com/k3s-io/k3s)  
30. Requirements \- K3s, accessed July 30, 2025, [https://docs.k3s.io/installation/requirements](https://docs.k3s.io/installation/requirements)  
31. Issues with K3s :: MetalLB, bare metal load-balancer for Kubernetes, accessed July 30, 2025, [https://metallb.universe.tf/configuration/k3s/](https://metallb.universe.tf/configuration/k3s/)  
32. Installation Using K3s — Cilium 1.17.6 documentation, accessed July 30, 2025, [https://docs.cilium.io/en/stable/installation/k3s.html](https://docs.cilium.io/en/stable/installation/k3s.html)  
33. Cluster Load Balancer \- K3s, accessed July 30, 2025, [https://docs.k3s.io/datastore/cluster-loadbalancer](https://docs.k3s.io/datastore/cluster-loadbalancer)  
34. Step-By-Step Guide: Hosting Longhorn on K3s (ARM) | by drunkcoding.net \- Medium, accessed July 30, 2025, [https://medium.com/@stevenhoang/step-by-step-guide-hosting-longhorn-on-k3s-arm-2328283d7244](https://medium.com/@stevenhoang/step-by-step-guide-hosting-longhorn-on-k3s-arm-2328283d7244)  
35. Kubernetes on Bare Metal: 7 reasons to use Longhorn for persistent storage \- Latitude.sh, accessed July 30, 2025, [https://www.latitude.sh/blog/kubernetes-on-bare-metal-7-reasons-to-use-longhorn-for-persistent-storage](https://www.latitude.sh/blog/kubernetes-on-bare-metal-7-reasons-to-use-longhorn-for-persistent-storage)  
36. Longhorn, accessed July 30, 2025, [https://longhorn.io/](https://longhorn.io/)  
37. K3s with NFS Storage Class, accessed July 30, 2025, [https://zaher.dev/blog/k3s-with-nfs-storage-class](https://zaher.dev/blog/k3s-with-nfs-storage-class)  
38. Installing Longhorn on ARM64 \- YouTube, accessed July 30, 2025, [https://www.youtube.com/watch?v=dJZkho50fts](https://www.youtube.com/watch?v=dJZkho50fts)  
39. Support Matrix \- Longhorn v1.4.x \- SUSE, accessed July 30, 2025, [https://www.suse.com/suse-longhorn/support-matrix/all-supported-versions/longhorn-v1-4-x/](https://www.suse.com/suse-longhorn/support-matrix/all-supported-versions/longhorn-v1-4-x/)  
40. \[FEATURE\] ARM64 GA · Issue \#4206 · longhorn/longhorn \- GitHub, accessed July 30, 2025, [https://github.com/longhorn/longhorn/issues/4206](https://github.com/longhorn/longhorn/issues/4206)  
41. Quick Installation \- Longhorn | Documentation, accessed July 30, 2025, [https://longhorn.io/docs/latest/deploy/install/](https://longhorn.io/docs/latest/deploy/install/)  
42. jerryshell/k8s-postgres-longhorn: K8s PostgreSQL Longhorn \- GitHub, accessed July 30, 2025, [https://github.com/jerryshell/k8s-postgres-longhorn](https://github.com/jerryshell/k8s-postgres-longhorn)  
43. RK1 \+ Talos \+ System Extensions Turing Pi \# forum, accessed July 30, 2025, [https://forum.turingpi.com/t/22774571/rk1-talos-system-extensions](https://forum.turingpi.com/t/22774571/rk1-talos-system-extensions)  
44. Longhorn for Kubernetes — Cloud‑Native Block Storage | by Asim Mirza | Medium, accessed July 30, 2025, [https://medium.com/@mughal.asim/longhorn-for-kubernetes-cloud-native-block-storage-4259cb47ef31](https://medium.com/@mughal.asim/longhorn-for-kubernetes-cloud-native-block-storage-4259cb47ef31)  
45. LONGHORN: Best Practices : r/kubernetes \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/kubernetes/comments/1cojq13/longhorn\_best\_practices/](https://www.reddit.com/r/kubernetes/comments/1cojq13/longhorn_best_practices/)  
46. Best Practices for Optimizing Longhorn Disk Performance | The open-source hyperconverged infrastructure solution for a cloud-native world \- Harvester, accessed July 30, 2025, [https://harvesterhci.io/kb/best\_practices\_for\_optimizing\_longhorn\_disk\_performance/](https://harvesterhci.io/kb/best_practices_for_optimizing_longhorn_disk_performance/)  
47. \[FEATURE\] Instance Manager Resource Request Strategy · Issue \#6351 \- GitHub, accessed July 30, 2025, [https://github.com/longhorn/longhorn/issues/6351](https://github.com/longhorn/longhorn/issues/6351)  
48. Using Nginx Ingress Controller in Kubernetes bare-metal setup | by Jeganathan Swaminathan ( jegan@tektutor.org ) \- Medium, accessed July 30, 2025, [https://medium.com/tektutor/using-nginx-ingress-controller-in-kubernetes-bare-metal-setup-890eb4e7772](https://medium.com/tektutor/using-nginx-ingress-controller-in-kubernetes-bare-metal-setup-890eb4e7772)  
49. Intro to Kube ingress: Set up nginx Ingress in Kubernetes Bare Metal \- Fairwinds, accessed July 30, 2025, [https://www.fairwinds.com/blog/intro-to-kubernetes-ingress-set-up-nginx-ingress-in-kubernetes-bare-metal](https://www.fairwinds.com/blog/intro-to-kubernetes-ingress-set-up-nginx-ingress-in-kubernetes-bare-metal)  
50. Bare Metal k8s ingress : r/kubernetes \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/kubernetes/comments/1aknjf7/bare\_metal\_k8s\_ingress/](https://www.reddit.com/r/kubernetes/comments/1aknjf7/bare_metal_k8s_ingress/)  
51. Kemp Ingress Controller for Kubernetes, accessed July 30, 2025, [https://kemptechnologies.com/solutions/kemp-ingress-controller-kubernetes](https://kemptechnologies.com/solutions/kemp-ingress-controller-kubernetes)  
52. Kubernetes Service Types: A Complete Guide, accessed July 30, 2025, [https://www.plural.sh/blog/kubernetes-service-types-guide/](https://www.plural.sh/blog/kubernetes-service-types-guide/)  
53. Understand Kubernetes Services | GKE networking \- Google Cloud, accessed July 30, 2025, [https://cloud.google.com/kubernetes-engine/docs/concepts/service](https://cloud.google.com/kubernetes-engine/docs/concepts/service)  
54. NodePort vs ClusterIP in Kubernetes: Which Service Type Fits Your Use Case? \- Medium, accessed July 30, 2025, [https://medium.com/@sachinadi424/nodeport-vs-clusterip-in-kubernetes-which-service-type-fits-your-use-case-c0091304e757](https://medium.com/@sachinadi424/nodeport-vs-clusterip-in-kubernetes-which-service-type-fits-your-use-case-c0091304e757)  
55. Kubernetes Service \- What It is, Types & Examples \- Spacelift, accessed July 30, 2025, [https://spacelift.io/blog/kubernetes-service](https://spacelift.io/blog/kubernetes-service)  
56. Difference between ClusterIP, NodePort and LoadBalancer service types in Kubernetes?, accessed July 30, 2025, [https://stackoverflow.com/questions/41509439/difference-between-clusterip-nodeport-and-loadbalancer-service-types-in-kuberne](https://stackoverflow.com/questions/41509439/difference-between-clusterip-nodeport-and-loadbalancer-service-types-in-kuberne)  
57. The Difference Between ClusterIP, NodePort, And LoadBalancer Kubernetes Services | Octopus blog, accessed July 30, 2025, [https://octopus.com/blog/difference-clusterip-nodeport-loadbalancer-kubernetes](https://octopus.com/blog/difference-clusterip-nodeport-loadbalancer-kubernetes)  
58. Kubernetes Service Types: ClusterIP vs. NodePort vs. LoadBalancer vs. Headless, accessed July 30, 2025, [https://edgedelta.com/company/blog/kubernetes-services-types](https://edgedelta.com/company/blog/kubernetes-services-types)  
59. Navigating Service Discovery: Best Practices in Kubernetes \- Appvia, accessed July 30, 2025, [https://www.appvia.io/blog/navigating-service-discovery-kubernetes](https://www.appvia.io/blog/navigating-service-discovery-kubernetes)  
60. Kubernetes Service Discovery: A Practical Guide \- Plural.sh, accessed July 30, 2025, [https://www.plural.sh/blog/kubernetes-service-discovery-guide/](https://www.plural.sh/blog/kubernetes-service-discovery-guide/)  
61. Basic Guide to Kubernetes Service Discovery \- DEV Community, accessed July 30, 2025, [https://dev.to/nomzykush/basic-guide-to-kubernetes-service-discovery-dmd](https://dev.to/nomzykush/basic-guide-to-kubernetes-service-discovery-dmd)  
62. How do I call another kubernetes service inside the same cluster \- Basanta Kharel's Blog, accessed July 30, 2025, [https://basantakharel.com/how-do-i-call-another-kubernetes-service-inside-the-same-cluster](https://basantakharel.com/how-do-i-call-another-kubernetes-service-inside-the-same-cluster)  
63. Installing the NVIDIA Container Toolkit, accessed July 30, 2025, [https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)  
64. NVIDIA Device Plugin for Kubernetes, accessed July 30, 2025, [https://catalog.ngc.nvidia.com/orgs/nvidia/helm-charts/nvidia-device-plugin](https://catalog.ngc.nvidia.com/orgs/nvidia/helm-charts/nvidia-device-plugin)  
65. NVIDIA Kubernetes Device Plugin, accessed July 30, 2025, [https://catalog.ngc.nvidia.com/orgs/nvidia/containers/k8s-device-plugin](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/k8s-device-plugin)  
66. NVIDIA device plugin for Kubernetes \- GitHub, accessed July 30, 2025, [https://github.com/NVIDIA/k8s-device-plugin](https://github.com/NVIDIA/k8s-device-plugin)  
67. Kubernetes Taints and Tolerations \- Guide and Examples \- Densify, accessed July 30, 2025, [https://www.densify.com/kubernetes-autoscaling/kubernetes-taints/](https://www.densify.com/kubernetes-autoscaling/kubernetes-taints/)  
68. Mastering Kubernetes Taints and Tolerations \- overcast blog, accessed July 30, 2025, [https://overcast.blog/mastering-kubernetes-taints-and-tolerations-08756d5faf55](https://overcast.blog/mastering-kubernetes-taints-and-tolerations-08756d5faf55)  
69. Kubernetes Taints & Tolerations: Best Practices Guide \- Plural.sh, accessed July 30, 2025, [https://www.plural.sh/blog/kubernetes-taint-best-practices/](https://www.plural.sh/blog/kubernetes-taint-best-practices/)  
70. Kubernetes Node Selector: Best Practices \- CloudBolt, accessed July 30, 2025, [https://www.cloudbolt.io/kubernetes-pod-scheduling/kubernetes-node-selector/](https://www.cloudbolt.io/kubernetes-pod-scheduling/kubernetes-node-selector/)  
71. Schedule GPUs | Kubernetes, accessed July 30, 2025, [https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/)  
72. 13 Advanced Kubernetes Scheduling Techniques You Should Know \- overcast blog, accessed July 30, 2025, [https://overcast.blog/13-advanced-kubernetes-scheduling-techniques-you-should-know-4b84a724f3b0](https://overcast.blog/13-advanced-kubernetes-scheduling-techniques-you-should-know-4b84a724f3b0)  
73. Kubernetes Affinity: Definitive Guide \- CloudBolt, accessed July 30, 2025, [https://www.cloudbolt.io/kubernetes-pod-scheduling/kubernetes-affinity/](https://www.cloudbolt.io/kubernetes-pod-scheduling/kubernetes-affinity/)  
74. Kubernetes Node Affinity and Anti-Affinity: A Guide \- overcast blog, accessed July 30, 2025, [https://overcast.blog/mastering-node-affinity-and-anti-affinity-in-kubernetes-db769af90f5c](https://overcast.blog/mastering-node-affinity-and-anti-affinity-in-kubernetes-db769af90f5c)  
75. Node Affinity in Kubernetes And Optimizing GPU Workloads | by Kaan Karakas | Medium, accessed July 30, 2025, [https://medium.com/@KaanKarakaskk/node-affinity-in-kubernetes-and-optimizing-gpu-workloads-bdfca5fffcdc](https://medium.com/@KaanKarakaskk/node-affinity-in-kubernetes-and-optimizing-gpu-workloads-bdfca5fffcdc)  
76. Jetson Mate \- Seeed Studio Wiki, accessed July 30, 2025, [https://wiki.seeedstudio.com/Jetson-Mate/](https://wiki.seeedstudio.com/Jetson-Mate/)  
77. Running Kubernetes on GPU Nodes. Jetson Nano is a small, powerful… | by Renjith Ravindranathan | techbeatly | Medium, accessed July 30, 2025, [https://medium.com/techbeatly/running-kubernetes-on-gpu-nodes-9ddd97dc4793](https://medium.com/techbeatly/running-kubernetes-on-gpu-nodes-9ddd97dc4793)  
78. Going hybrid \- Microk8s with arm64 \+ x86\_64 | Details \- Hackaday.io, accessed July 30, 2025, [https://hackaday.io/project/175422/log/186431-going-hybrid-microk8s-with-arm64-x8664](https://hackaday.io/project/175422/log/186431-going-hybrid-microk8s-with-arm64-x8664)  
79. ARM Instances Explained with Practical AWS Example \- PerfectScale, accessed July 30, 2025, [https://www.perfectscale.io/blog/arm-instances-kubernetes](https://www.perfectscale.io/blog/arm-instances-kubernetes)  
80. An Armful of clusters \- Giant Swarm, accessed July 30, 2025, [https://www.giantswarm.io/blog/an-armful-of-clusters](https://www.giantswarm.io/blog/an-armful-of-clusters)  
81. arm64v8/node Tags \- Docker Hub, accessed July 30, 2025, [https://hub.docker.com/r/arm64v8/node/tags](https://hub.docker.com/r/arm64v8/node/tags)  
82. postgresql 16.7.21 · bitnami/bitnami \- Artifact Hub, accessed July 30, 2025, [https://artifacthub.io/packages/helm/bitnami/postgresql](https://artifacthub.io/packages/helm/bitnami/postgresql)  
83. redis 21.2.13 · bitnami/bitnami \- Artifact Hub, accessed July 30, 2025, [https://artifacthub.io/packages/helm/bitnami/redis](https://artifacthub.io/packages/helm/bitnami/redis)  
84. minio 8.0.10 \- Artifact Hub, accessed July 30, 2025, [https://artifacthub.io/packages/helm/minio/minio](https://artifacthub.io/packages/helm/minio/minio)  
85. Connecting Applications with Services \- Kubernetes, accessed July 30, 2025, [https://kubernetes.io/docs/tutorials/services/connect-applications-service/](https://kubernetes.io/docs/tutorials/services/connect-applications-service/)  
86. Connecting Applications with Services \- Kubernetes, accessed July 30, 2025, [https://pwittrock.github.io/docs/concepts/services-networking/connect-applications-service/](https://pwittrock.github.io/docs/concepts/services-networking/connect-applications-service/)  
87. Turing RK1 is 2x faster, 1.8x pricier than Pi 5 | Jeff Geerling, accessed July 30, 2025, [https://www.jeffgeerling.com/blog/2024/turing-rk1-2x-faster-18x-pricier-pi-5](https://www.jeffgeerling.com/blog/2024/turing-rk1-2x-faster-18x-pricier-pi-5)  
88. NVIDIA Jetson Orin NX 8GB & 16GB for vision AI Development \- VisionPlatform.ai, accessed July 30, 2025, [https://visionplatform.ai/nvidia-jetson-orin-nx-8gb-16gb/](https://visionplatform.ai/nvidia-jetson-orin-nx-8gb-16gb/)  
89. Testing the PiBox mini 2, a Raspberry Pi MicroK8s server \- YouTube, accessed July 30, 2025, [https://www.youtube.com/watch?v=YtdVotS3018](https://www.youtube.com/watch?v=YtdVotS3018)  
90. Longhorn Performance Benchmarking, accessed July 30, 2025, [https://dennislee22.github.io/docs/longhorn/benchmarking/](https://dennislee22.github.io/docs/longhorn/benchmarking/)  
91. Performance overhead · longhorn longhorn · Discussion \#10306 \- GitHub, accessed July 30, 2025, [https://github.com/longhorn/longhorn/discussions/10306](https://github.com/longhorn/longhorn/discussions/10306)  
92. Jetson Benchmarks \- NVIDIA Developer, accessed July 30, 2025, [https://developer.nvidia.com/embedded/jetson-benchmarks](https://developer.nvidia.com/embedded/jetson-benchmarks)  
93. Benchmarks \- NVIDIA Jetson AI Lab, accessed July 30, 2025, [https://www.jetson-ai-lab.com/benchmarks.html](https://www.jetson-ai-lab.com/benchmarks.html)  
94. Ultralytics YOLO11 on NVIDIA Jetson Orin Nano Super: fast and efficient, accessed July 30, 2025, [https://www.ultralytics.com/blog/ultralytics-yolo11-on-nvidia-jetson-orin-nano-super-fast-and-efficient](https://www.ultralytics.com/blog/ultralytics-yolo11-on-nvidia-jetson-orin-nano-super-fast-and-efficient)  
95. How Fast Does the Jetson Nano Really Run Large Language Models?, accessed July 30, 2025, [https://www.jeremymorgan.com/blog/tech/nvidia-jetson-orin-nano-speed-test/](https://www.jeremymorgan.com/blog/tech/nvidia-jetson-orin-nano-speed-test/)  
96. How to create a Mastodon server \- IONOS, accessed July 30, 2025, [https://www.ionos.com/digitalguide/server/know-how/how-to-create-a-mastodon-server/](https://www.ionos.com/digitalguide/server/know-how/how-to-create-a-mastodon-server/)  
97. How to Host a Mastodon Instance on a Budget \- RamNode, accessed July 30, 2025, [https://ramnode.com/blog/how-to-host-a-mastodon-instance-on-a-budget/](https://ramnode.com/blog/how-to-host-a-mastodon-instance-on-a-budget/)  
98. How heavy is a single-user Mastodon instance? : r/selfhosted \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/selfhosted/comments/shbf6v/how\_heavy\_is\_a\_singleuser\_mastodon\_instance/](https://www.reddit.com/r/selfhosted/comments/shbf6v/how_heavy_is_a_singleuser_mastodon_instance/)  
99. Server requirements experience for a small group | Cloudron Forum, accessed July 30, 2025, [https://forum.cloudron.io/topic/8075/server-requirements-experience-for-a-small-group](https://forum.cloudron.io/topic/8075/server-requirements-experience-for-a-small-group)  
100. Concepts for sizing CPU and memory resources \- Keycloak, accessed July 30, 2025, [https://www.keycloak.org/high-availability/concepts-memory-and-cpu-sizing](https://www.keycloak.org/high-availability/concepts-memory-and-cpu-sizing)  
101. System Requirements | keycloak-documentation, accessed July 30, 2025, [https://wjw465150.gitbooks.io/keycloak-documentation/content/server\_installation/topics/installation/system-requirements.html](https://wjw465150.gitbooks.io/keycloak-documentation/content/server_installation/topics/installation/system-requirements.html)  
102. Kubernetes Resource Requirements, accessed July 30, 2025, [https://docs.cloudblue.com/cbc/21.0/Monitoring-and-Alerting-Guide/Resource-Requirements.htm](https://docs.cloudblue.com/cbc/21.0/Monitoring-and-Alerting-Guide/Resource-Requirements.htm)  
103. Setting Up Grafana Loki on Kubernetes: A Simplified Guide | by Sagar Srivastava | Medium, accessed July 30, 2025, [https://medium.com/@sagar-srivastava/setting-up-grafana-loki-on-kubernetes-a-simplified-guide-97fbf850ba55](https://medium.com/@sagar-srivastava/setting-up-grafana-loki-on-kubernetes-a-simplified-guide-97fbf850ba55)  
104. Kubernetes Homelab Series (Part 2): Longhorn \+ MinIO for Persistent Storage, accessed July 30, 2025, [https://pdelarco.medium.com/kubernetes-homelab-series-part-2-longhorn-minio-for-persistent-storage-7f65e0bfbbb8](https://pdelarco.medium.com/kubernetes-homelab-series-part-2-longhorn-minio-for-persistent-storage-7f65e0bfbbb8)  
105. Setting a Backup Target \- Longhorn | Documentation, accessed July 30, 2025, [https://longhorn.io/docs/1.9.0/snapshots-and-backups/backup-and-restore/set-backup-target/](https://longhorn.io/docs/1.9.0/snapshots-and-backups/backup-and-restore/set-backup-target/)  
106. Using MinIO as a Backup Target for Rancher Longhorn \- Support Tools, accessed July 30, 2025, [https://support.tools/minio-backup-target-longhorn/](https://support.tools/minio-backup-target-longhorn/)  
107. CloudNativePG \+ Longhorn : r/kubernetes \- Reddit, accessed July 30, 2025, [https://www.reddit.com/r/kubernetes/comments/1h2kfq6/cloudnativepg\_longhorn/](https://www.reddit.com/r/kubernetes/comments/1h2kfq6/cloudnativepg_longhorn/)