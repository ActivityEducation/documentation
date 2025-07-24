import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import { VideoPlayer, Button, Icon } from '@activityeducation/component-library';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.row}>
          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/intro">
              Learn more
            </Link>
          </div>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              href="https://edupub.social">
              Join edupub.social
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Home`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <section className={styles.videoContainer}>
          <div className={styles.videoContent}>
            <h2 className={styles.headerText}>Interactive Video Lessons</h2>
            <p className={styles.centerText}>One of the core features of the EducationPub platform is the ability to create custom educational material to help with studying and teaching alike. The video to the left is an example of an interupted vieo lesson element that allows for displaying questions at just the right moment.</p>
          </div>
          <VideoPlayer
            className={styles.videoPlayer}
            placeholderImage='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToIUwWMOhlktMDqbLN3K1DaVIOW9zJCHoatg'
            interrupts={[
              {
                content: <><h3 style={{color: '#1a1c1d', fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: 500, lineHeight: 1.4, margin: 0}}>Quick Question!</h3><p style={{color: '#1a1c1d', fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5, margin: 0}}>What is the main character of this video?</p></>,
                id: 'intro-question',
                timestampSeconds: 3
              },
              {
                content: <><h3 style={{color: '#1a1c1d', fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', fontWeight: 500, lineHeight: 1.4, margin: 0}}>Did You Know?</h3><p style={{color: '#1a1c1d', fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5, margin: 0}}>This video is a popular open-source animation.</p></>,
                id: 'mid-video-info',
                timestampSeconds: 7
              }
            ]}
            src="https://www.w3schools.com/html/mov_bbb.mp4"
            title="Video with Interrupts"
          />
        </section>
        <section>
          <h2 className={styles.headerText}>Why EducationPub?</h2>
          <HomepageFeatures />
        </section>
      </main>
    </Layout>
  );
}
