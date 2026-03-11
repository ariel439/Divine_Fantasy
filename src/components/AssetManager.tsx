import React, { useEffect, useMemo } from 'react';
import { useLocationStore } from '../stores/useLocationStore';
import locationsData from '../data/locations.json';
import npcsData from '../data/npcs.json';

/**
 * AssetManager Component
 * 
 * Handles preloading of images and audio for current and adjacent locations.
 * This reduces stutter and "pop-in" when navigating between screens.
 */
const AssetManager: React.FC = () => {
  const { currentLocationId } = useLocationStore();

  // Identify adjacent location IDs from the current location's actions
  const adjacentLocationIds = useMemo(() => {
    const loc = (locationsData as any)[currentLocationId];
    if (!loc || !loc.actions) return [];
    
    return loc.actions
      .filter((a: any) => a.type === 'navigate')
      .map((a: any) => a.target);
  }, [currentLocationId]);

  // Identify NPC portraits for the current location
  const npcPortraits = useMemo(() => {
    const loc = (locationsData as any)[currentLocationId];
    if (!loc || !loc.actions) return [];
    
    const dialogueNpcIds = loc.actions
      .filter((a: any) => a.type === 'dialogue')
      .map((a: any) => a.target);
      
    return dialogueNpcIds
      .map((id: string) => (npcsData as any)[id]?.portrait)
      .filter(Boolean);
  }, [currentLocationId]);

  useEffect(() => {
    // 1. Preload current location assets (day/night variants)
    const currentLoc = (locationsData as any)[currentLocationId];
    if (currentLoc) {
      preloadLocationAssets(currentLoc);
    }

    // 2. Preload NPC portraits for current location
    npcPortraits.forEach(url => preloadUrl(url));

    // 3. Preload adjacent locations
    adjacentLocationIds.forEach(id => {
      const adjLoc = (locationsData as any)[id];
      if (adjLoc) {
        preloadLocationAssets(adjLoc);
      }
    });
  }, [currentLocationId, adjacentLocationIds, npcPortraits]);

  // This component doesn't render anything
  return null;
};

// Track preloaded URLs to avoid redundant requests
const preloadedUrls = new Set<string>();

/**
 * Preloads background images and music tracks for a given location.
 */
function preloadLocationAssets(loc: any) {
  const assets = [
    loc.day_background,
    loc.night_background,
    loc.music_track
  ].filter(Boolean);

  assets.forEach(url => preloadUrl(url));
}

/**
 * Core preloading logic for a single URL.
 */
function preloadUrl(url: string) {
  // Skip if already preloaded or if it's a placeholder path
  if (!url || preloadedUrls.has(url) || url.startsWith('GDD/')) return;
  
  // Use a case-insensitive check for extensions
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.webp')) {
    const img = new Image();
    img.src = url;
    preloadedUrls.add(url);
  } else if (lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.ogg')) {
    const audio = new Audio();
    audio.src = url;
    audio.preload = 'auto';
    preloadedUrls.add(url);
  }
}

export default AssetManager;
