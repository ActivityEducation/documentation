import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Decentralized',
    Svg: require('@site/static/img/network_node_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.svg').default,
    description: (
      <>
        Communities on this platform operate within a decentralized network, ensuring the learning 
        experience is shaped by collective values. This structure fosters diverse environments, 
        free from distant central authority.
      </>
    ),
  },
  {
    title: 'Open Source',
    Svg: require('@site/static/img/folder_code_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.svg').default,
    description: (
      <>
        Transparency is fundamental, with the platform's open-source technology allowing for public 
        inspection and contribution. This collaborative approach drives continuous innovation, 
        yielding tools designed for broad utility.
      </>
    ),
  },
  {
    title: 'Not for Sale',
    Svg: require('@site/static/img/money_off_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.svg').default,
    description: (
      <>
        A primary focus remains on the learning journey, unhindered by intrusive ads or manipulative 
        algorithms. The platform's design prioritizes valuable educational content and genuine 
        connections, ensuring data is never a commodity.
      </>
    ),
  },
  {
    title: 'Interoperable',
    Svg: require('@site/static/img/auto_transmission_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.svg').default,
    description: (
      <>
        Seamless access to the wider Fediverse is a core capability. The network inherently 
        extends across a vast, interconnected digital universe, enabling true knowledge sharing without 
        borders.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--3 feature')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
